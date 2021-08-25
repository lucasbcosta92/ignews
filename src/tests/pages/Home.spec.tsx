import { render, screen } from "@testing-library/react";
import { stripe } from "../../services/stripe";
import Home, { getStaticProps } from "../../pages";
import { mocked } from "ts-jest/utils";

jest.mock("next/router");
jest.mock("next-auth/client", () => {
  return { useSession: () => [null, false] };
});

jest.mock("../../services/stripe");

describe("Home page", () => {
  it("Render correctly", () => {
    render(<Home product={{ priceId: "fake-price-id", amount: "R$100,00" }} />);

    expect(screen.getByText("for R$100,00 month")).toBeInTheDocument();
  });

  // SSR test
  it("loads initial data", async () => {
    const retriveStripePricesMocked = mocked(stripe.prices.retrieve);

    /**  retriveStripePricesMocked é uma Promise, então o corretoa se
     * usar é o mockedResolvedValueOnce, e não o mockedReturnValueOnce
     */

    retriveStripePricesMocked.mockResolvedValueOnce({
      id: "fake-price-id",
      unit_amount: 1000,
    } as any);

    const response = await getStaticProps({});

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          product: {
            priceId: "fake-price-id",
            amount: "$10.00",
          },
        },
      })
    );
  });
});
