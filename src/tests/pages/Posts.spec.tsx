import { render, screen } from "@testing-library/react";
import Posts, { getStaticProps } from "../../pages/posts";
import { getPrismicClient } from "../../services/prismic";
import { mocked } from "ts-jest/utils";

const posts = [
  {
    slug: "my-post",
    title: "My post",
    excerpt: "Post excerpt",
    updatedAt: "25 de Agosto",
  },
];

jest.mock("../../services/prismic");

describe("Posts page", () => {
  it("Render correctly", () => {
    render(<Posts posts={posts} />);

    expect(screen.getByText("My post")).toBeInTheDocument();
  });

  // SSR test
  it("loads initial data", async () => {
    const getPrimiscClientMocked = mocked(getPrismicClient);

    getPrimiscClientMocked.mockReturnValueOnce({
      query: jest.fn().mockResolvedValueOnce({
        results: [
          {
            uid: "my-post",
            data: {
              title: [{ type: "heading", text: "My post" }],
              content: [{ type: "paragraph", text: "Post excerpt" }],
            },
            last_publication_date: "08-25-2021",
          },
        ],
      }),
    } as any);

    const response = await getStaticProps({});

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          posts: [
            {
              slug: "my-post",
              title: "My post",
              excerpt: "Post excerpt",
              updatedAt: "25 de agosto de 2021",
            },
          ],
        },
      })
    );
  });
});
