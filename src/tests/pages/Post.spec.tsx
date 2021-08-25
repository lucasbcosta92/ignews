import { render, screen } from "@testing-library/react";
import { getSession } from "next-auth/client";
import { mocked } from "ts-jest/utils";
import Post, { getServerSideProps } from "../../pages/posts/[slug]";
import { getPrismicClient } from "../../services/prismic";

const post = {
  slug: "my-post",
  title: "My post",
  content: "<p>Post content</p>",
  updatedAt: "25 de Agosto",
};

jest.mock("../../services/prismic");
jest.mock("next-auth/client");

describe("Post page", () => {
  it("Render correctly", () => {
    render(<Post post={post} />);

    expect(screen.getByText("My post")).toBeInTheDocument();
    expect(screen.getByText("Post content")).toBeInTheDocument();
  });

  it("Redirects user if no subscription is found", async () => {
    const getSessionMocked = mocked(getSession);
    getSessionMocked.mockResolvedValueOnce(null);

    const response = await getServerSideProps({
      params: {
        slug: "my-post",
      },
    } as any);

    expect(response).toEqual(
      expect.objectContaining({
        redirect: expect.objectContaining({
          destination: "/",
        }),
      })
    );
  });

  it("loads initial data", async () => {
    const getSessionMocked = mocked(getSession);
    const getPrismicClientMocked = mocked(getPrismicClient);

    getSessionMocked.mockResolvedValueOnce({
      activeSubscription: "fake-active-subscription",
    });

    getPrismicClientMocked.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValueOnce({
        data: {
          title: [{ type: "heading", text: "My post" }],
          content: [{ type: "paragraph", text: "Post content" }],
        },
        last_publication_date: "08-25-2021",
      }),
    } as any);

    const response = await getServerSideProps({
      params: {
        slug: "my-post",
      },
    } as any);

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          post: {
            slug: "my-post",
            title: "My post",
            content: "<p>Post content</p>",
            updatedAt: "25 de agosto de 2021",
          },
        },
      })
    );
  });
});
