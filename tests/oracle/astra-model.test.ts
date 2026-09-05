import { describe, expect, test, vi } from "vitest";
import { resolveApiModel } from "../../src/cli/options.js";
import { DEFAULT_MODEL } from "../../src/oracle/config.js";
import { resolveModelConfig } from "../../src/oracle/modelResolver.js";
import { buildRequestBody } from "../../src/oracle/request.js";
import { buildBrowserConfig, mapModelToBrowserLabel } from "../../src/cli/browserConfig.js";

describe("Astra API model resolution", () => {
  test("rejects unsupported browser selection instead of falling back to Pro", async () => {
    expect(() => mapModelToBrowserLabel("gpt-6-astra")).toThrow("only with --engine api");
    await expect(buildBrowserConfig({ model: "gpt-6-astra" })).rejects.toThrow(
      "only with --engine api",
    );
  });
  test("resolves the exact API ID locally without consulting a provider catalog", async () => {
    const fetcher = vi.fn(() => {
      throw new Error("Unexpected catalog request");
    });
    const model = resolveApiModel("gpt-6-astra");
    const config = await resolveModelConfig(model, { fetcher });
    expect(fetcher).not.toHaveBeenCalled();
    expect(config.provider).toBe("openai");
    expect(config.inputLimit).toBe(272_000);
    expect(config.pricing).toEqual({ inputPerToken: 0.00001, outputPerToken: 0.00005 });
    const request = buildRequestBody({
      modelConfig: config,
      systemPrompt: "Review",
      userPrompt: "Code",
      searchEnabled: true,
    });
    expect(request.model).toBe("gpt-6-astra");
    expect(request.reasoning).toEqual({ effort: "xhigh" });
    expect(request.tools).toEqual([{ type: "web_search" }]);
    expect(DEFAULT_MODEL).toBe("gpt-5.5-pro");
  });
});
