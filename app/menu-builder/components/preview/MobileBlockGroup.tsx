import type { MenuItem } from "../../types";
import type { MobilePanelDeps } from "./mobile-deps";
import { renderBlogBlockImpl } from "./blocks/BlogBlock";
import { renderCollectionBlockImpl } from "./blocks/CollectionBlock";
import { renderContactBlockImpl } from "./blocks/ContactBlock";
import { renderHtmlBlockImpl } from "./blocks/HtmlBlock";
import { renderImageBlockImpl } from "./blocks/ImageBlock";
import { renderLinkListBlockImpl } from "./blocks/LinkListBlock";
import { renderProductBlockImpl } from "./blocks/ProductBlock";
import { renderSpaceBlockImpl } from "./blocks/SpaceBlock";

export function renderMobileBlockGroupImpl(deps: MobilePanelDeps, group: MenuItem) {
  const { builderSettings } = deps;
  const renderMobileBlockGroup = (g: MenuItem) => renderMobileBlockGroupImpl(deps, g);
  const renderImageBlock = (g: MenuItem, o: Parameters<typeof renderImageBlockImpl>[2] = {}) =>
    renderImageBlockImpl(deps, g, o);
  const renderContactBlock = (g: MenuItem, o: Parameters<typeof renderContactBlockImpl>[2] = {}) =>
    renderContactBlockImpl(deps, g, o);
  const renderHtmlBlock = (g: MenuItem, o: Parameters<typeof renderHtmlBlockImpl>[2] = {}) =>
    renderHtmlBlockImpl(deps, g, o);
  const renderProductBlock = (g: MenuItem, o: Parameters<typeof renderProductBlockImpl>[2] = {}) =>
    renderProductBlockImpl(deps, g, o);
  const renderCollectionBlock = (g: MenuItem, o: Parameters<typeof renderCollectionBlockImpl>[2] = {}) =>
    renderCollectionBlockImpl(deps, g, o);
  const renderBlogBlock = (g: MenuItem, o: Parameters<typeof renderBlogBlockImpl>[2] = {}) =>
    renderBlogBlockImpl(deps, g, o);
  const renderSpaceBlock = (g: MenuItem, o: Parameters<typeof renderSpaceBlockImpl>[2] = {}) =>
    renderSpaceBlockImpl(deps, g, o);
  const renderLinkListBlock = (g: MenuItem, o: Parameters<typeof renderLinkListBlockImpl>[2] = {}) =>
    renderLinkListBlockImpl(deps, g, o);
    if (group.blockTemplate === "links") {
      return renderLinkListBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { minWidth: 0, width: "100%" },
        toolbarPlacement: "floating",
      });
    }
    if (group.blockTemplate === "image" || group.blockTemplate === "image2") {
      return renderImageBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { minWidth: 0, width: "100%" },
      });
    }
    if (group.blockTemplate === "contact") {
      return renderContactBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { width: "100%" },
      });
    }
    if (
      group.blockTemplate === "product" ||
      group.blockTemplate === "product-horizontal" ||
      group.blockTemplate === "product-grid" ||
      group.blockTemplate === "product-carousel" ||
      group.blockTemplate === "product-grid-horizontal"
    ) {
      return renderProductBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { width: "100%" },
      });
    }
    if (group.blockTemplate === "collection") {
      return renderCollectionBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { width: "100%" },
      });
    }
    if (group.blockTemplate === "blogs" || group.blockTemplate === "blogs-latest") {
      return renderBlogBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { width: "100%" },
      });
    }
    if (group.blockTemplate === "html") {
      return renderHtmlBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { width: "100%" },
      });
    }
    if (group.blockTemplate === "space") {
      return renderSpaceBlock(group, {
        wrapperStyle: { width: "100%" },
      });
    }
    if (group.blockTemplate === "multi") {
      return (
        <div key={group.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {group.children?.map((child) => renderMobileBlockGroup(child))}
        </div>
      );
    }
    return null;
}
