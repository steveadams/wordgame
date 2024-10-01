import { render } from "@solidjs/testing-library";
import { expect, describe, it } from "vitest";

import App from "./App";

describe("test", () => {
  it("passes", () => {
    render(() => App({}));

    expect(true).toBeTruthy();
  });
});
