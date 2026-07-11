import type { MenuItem } from "../../types";
import type { PreviewBlockDeps } from "./blocks/deps";
import { renderHtmlBlockImpl } from "./blocks/HtmlBlock";
import { renderLinkListBlockImpl } from "./blocks/LinkListBlock";
import { renderProductBlockImpl } from "./blocks/ProductBlock";

export function renderElementGroupMasonryImpl(deps: PreviewBlockDeps, groups: MenuItem[]) {
  const { isMobilePreview, useBlockFlexLayout } = deps;
  const renderHtmlBlock = (
    g: MenuItem,
    o: Parameters<typeof renderHtmlBlockImpl>[2] = {}
  ) => renderHtmlBlockImpl(deps, g, o);
  const renderLinkListBlock = (
    g: MenuItem,
    o: Parameters<typeof renderLinkListBlockImpl>[2] = {}
  ) => renderLinkListBlockImpl(deps, g, o);
  const renderProductBlock = (
    g: MenuItem,
    o: Parameters<typeof renderProductBlockImpl>[2] = {}
  ) => renderProductBlockImpl(deps, g, o);
    if (!groups.length) return null;
    const productGroup = groups.find((group) => group.blockTemplate === "product");
    const htmlGroup = groups.find((group) => group.blockTemplate === "html");
    const linkGroups = groups.filter((group) => group.blockTemplate === "links");
    const leftWidthUnits = Math.max(
      1,
      Math.min(11, productGroup?.productWidth ?? htmlGroup?.imageWidth ?? 3)
    );
    const rightWidthUnits = Math.max(1, 12 - leftWidthUnits);
    const leftBasis = `${Math.round((leftWidthUnits / 12) * 100)}%`;
    const rightBasis = `${Math.round((rightWidthUnits / 12) * 100)}%`;
    const linkWeights = linkGroups.map((group) =>
      Math.max(1, Math.min(12, group.linkWidth ?? 3))
    );
    const linkTotal = linkWeights.reduce((sum, value) => sum + value, 0) || 1;

    const isMobileMasonry = isMobilePreview;

    return (
      <div
        key="multi-element-group-masonry"
        style={{
          display: "flex",
          gap: isMobileMasonry ? 12 : 24,
          flexWrap: "nowrap",
          flexDirection: isMobileMasonry ? "column" : "row",
          alignItems: "flex-start",
          width: "100%",
          flex: useBlockFlexLayout ? "0 0 100%" : undefined,
        }}
      >
        <div
          style={{
            flex: isMobileMasonry ? "1 1 100%" : `0 1 ${leftBasis}`,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            width: isMobileMasonry ? "100%" : undefined,
          }}
        >
          {productGroup
            ? renderProductBlock(productGroup, {
              flex: "0 0 auto",
              wrapperStyle: { minWidth: 0, padding: 0, width: "100%" },
            })
            : null}
          {htmlGroup
            ? renderHtmlBlock(htmlGroup, {
              flex: "0 0 auto",
              wrapperStyle: { minWidth: 0, padding: 0, width: "100%" },
            })
            : null}
        </div>
        <div
          style={{
            flex: isMobileMasonry ? "1 1 100%" : `0 1 ${rightBasis}`,
            minWidth: 0,
            display: "flex",
            gap: isMobileMasonry ? 12 : 16,
            flexWrap: "nowrap",
            flexDirection: isMobileMasonry ? "column" : "row",
            width: isMobileMasonry ? "100%" : undefined,
          }}
        >
          {linkGroups.map((child, index) => {
            const linkShare = linkWeights[index] / linkTotal;
            const linkBasis = `${Math.round(linkShare * 100)}%`;
            return renderLinkListBlock(child, {
              flex: isMobileMasonry ? "1 1 100%" : `0 1 ${linkBasis}`,
              wrapperStyle: { minWidth: 0, width: isMobileMasonry ? "100%" : undefined },
              toolbarPlacement: "floating",
            });
          })}
        </div>
      </div>
    );
}
