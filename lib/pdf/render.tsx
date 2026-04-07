import { renderToBuffer } from "@react-pdf/renderer"
import { BlueprintPdf, type BlueprintPdfProps } from "./blueprint"

/**
 * Renders the Blueprint PDF React tree to a Node Buffer suitable for
 * email attachment or HTTP response. This is the single entry point
 * that API routes should use — keep all @react-pdf/renderer imports
 * funneled through here so the dependency surface stays small.
 */
export async function renderBlueprintPdf(
  props: BlueprintPdfProps
): Promise<Buffer> {
  return renderToBuffer(<BlueprintPdf {...props} />)
}
