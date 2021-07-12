import { query as q } from "faunadb";
import NextAuth from "next-auth";
import Providers from "next-auth/providers";
import { fauna } from "./../../../services/faundb";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scope: "read:user",
    }),
  ],
  callbacks: {
    async session(session) {
      try {
        const userActiveSubscription = await fauna.query(
          q.Get(
            q.Intersection([
              q.Match(
                q.Index("subscription_by_user_ref"),
                q.Select(
                  "ref",
                  q.Get(
                    q.Match(
                      q.Index("user_by_email"),
                      q.Casefold(session.user.email)
                    )
                  )
                )
              ),
              q.Match(q.Index("subscription_by_status"), "active"),
            ])
          )
        );

        return { ...session, activeSubscription: userActiveSubscription };
      } catch (error) {
        return { ...session, activeSubscription: null };
      }
    },
    async signIn(user, account, profile) {
      const { email } = user;

      try {
        // Inserindo dados no faunadb
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(
                  // Where do SQL
                  q.Index("user_by_email"), // Indice criado no Fauna
                  q.Casefold(user.email) // Casefold -> lowercase
                )
              )
            ),
            q.Create(
              q.Collection("users"), // Definindo a 'tabela'
              { data: { email } }
            ),
            // Senão...
            q.Get(
              q.Match(
                // Where do SQL
                q.Index("user_by_email"), // Indice criado no Fauna
                q.Casefold(user.email) // Casefold -> lowercase
              )
            )
          )
        );
        return true;
      } catch (error) {
        return false;
      }
    },
  },
});
