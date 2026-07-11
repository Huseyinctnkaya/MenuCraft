import { BlockStack, Button, Icon, InlineStack, Text, TextField } from "@shopify/polaris";
import { ArrowLeftIcon, SearchIcon } from "@shopify/polaris-icons";

import type { ProductSummary } from "../../types";

type ProductPickerPanelProps = {
  productPickerOpen: boolean;
  productPickerSearch: string;
  setProductPickerSearch: (value: string) => void;
  productPickerSelection: Record<string, boolean>;
  productPickerTargetId: string | null;
  products: ProductSummary[];
  toggleProductSelection: (id: string) => void;
  closeProductPicker: () => void;
  applyProductSelection: () => void;
};

export function ProductPickerPanel({
  productPickerOpen,
  productPickerSearch,
  setProductPickerSearch,
  productPickerSelection,
  productPickerTargetId,
  products,
  toggleProductSelection,
  closeProductPicker,
  applyProductSelection,
}: ProductPickerPanelProps) {
  if (!productPickerOpen) return null;
  const searchValue = productPickerSearch.trim().toLowerCase();
  const filteredProducts = searchValue
    ? products.filter((product) => product.title.toLowerCase().includes(searchValue))
    : products;
  return (
    <div className="flex h-full flex-col border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <InlineStack gap="200" blockAlign="center">
          <Button
            variant="tertiary"
            icon={ArrowLeftIcon}
            onClick={closeProductPicker}
            accessibilityLabel="Back"
          />
          <Text as="h2" variant="headingSm">
            {productPickerTargetId ? "Select product" : "Select products"}
          </Text>
        </InlineStack>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <BlockStack gap="300">
          <TextField
            label="Search"
            labelHidden
            value={productPickerSearch}
            onChange={setProductPickerSearch}
            placeholder="Search"
            autoComplete="off"
            prefix={<Icon source={SearchIcon} tone="subdued" />}
          />
          <BlockStack gap="200">
            {filteredProducts.length ? (
              filteredProducts.map((product) => {
                const isSelected = Boolean(productPickerSelection[product.id]);
                return (
                  <label
                    key={product.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProductSelection(product.id)}
                      className="h-4 w-4"
                    />
                    <div className="h-10 w-10 overflow-hidden rounded-md border border-gray-200 bg-white">
                      <img
                        src={product.featuredImage?.url ?? "/product.png"}
                        alt={product.featuredImage?.altText ?? product.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="flex-1">{product.title}</span>
                  </label>
                );
              })
            ) : (
              <Text as="p" variant="bodySm" tone="subdued">
                No products found.
              </Text>
            )}
          </BlockStack>
        </BlockStack>
      </div>
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <InlineStack align="end" gap="200">
          <Button variant="tertiary" onClick={closeProductPicker}>
            Cancel
          </Button>
          <Button variant="primary" onClick={applyProductSelection}>
            Apply
          </Button>
        </InlineStack>
      </div>
    </div>
  );
}
