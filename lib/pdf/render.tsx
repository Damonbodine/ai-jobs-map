import { renderToBuffer } from "@react-pdf/renderer"
import { BlueprintPdf, type BlueprintPdfProps } from "./blueprint"
import { DepartmentPdf, type DepartmentPdfProps } from "./department"

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

export async function renderDepartmentPdf(
  props: DepartmentPdfProps
): Promise<Buffer> {
  return renderToBuffer(<DepartmentPdf {...props} />)
}
