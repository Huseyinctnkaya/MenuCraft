import { BlockStack, Button, Icon, InlineStack, Text, TextField } from "@shopify/polaris";
import { ArrowLeftIcon, CollectionIcon, SearchIcon } from "@shopify/polaris-icons";

export type CollectionPickerItem = {
  id: string;
  title: string;
  handle: string;
  image?: { url: string; altText?: string | null } | null;
};

type CollectionPickerPanelProps = {
  collectionPickerOpen: boolean;
  collectionPickerSearch: string;
  setCollectionPickerSearch: (value: string) => void;
  collectionPickerSelection: Record<string, boolean>;
  collectionPickerTargetId: string | null;
  collections: CollectionPickerItem[];
  toggleCollectionSelection: (id: string) => void;
  closeCollectionPicker: () => void;
  applyCollectionSelection: () => void;
};

export function CollectionPickerPanel({
  collectionPickerOpen,
  collectionPickerSearch,
  setCollectionPickerSearch,
  collectionPickerSelection,
  collectionPickerTargetId,
  collections,
  toggleCollectionSelection,
  closeCollectionPicker,
  applyCollectionSelection,
}: CollectionPickerPanelProps) {
  if (!collectionPickerOpen) return null;
  const searchValue = collectionPickerSearch.trim().toLowerCase();
  const filteredCollections = searchValue
    ? collections.filter((collection) => collection.title.toLowerCase().includes(searchValue))
    : collections;
  return (
    <div className="flex h-full flex-col border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <InlineStack gap="200" blockAlign="center">
          <Button
            variant="tertiary"
            icon={ArrowLeftIcon}
            onClick={closeCollectionPicker}
            accessibilityLabel="Back"
          />
          <Text as="h2" variant="headingSm">
            {collectionPickerTargetId ? "Select collection" : "Select collections"}
          </Text>
        </InlineStack>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <BlockStack gap="300">
          <TextField
            label="Search"
            labelHidden
            value={collectionPickerSearch}
            onChange={setCollectionPickerSearch}
            placeholder="Search"
            autoComplete="off"
            prefix={<Icon source={SearchIcon} tone="subdued" />}
          />
          <BlockStack gap="200">
            {filteredCollections.length ? (
              filteredCollections.map((collection) => {
                const isSelected = Boolean(collectionPickerSelection[collection.id]);
                return (
                  <label
                    key={collection.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCollectionSelection(collection.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                      {collection.image?.url ? (
                        <img
                          src={collection.image.url}
                          alt={collection.image.altText ?? collection.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon source={CollectionIcon} tone="subdued" />
                      )}
                    </div>
                    <span className="flex-1">{collection.title}</span>
                  </label>
                );
              })
            ) : (
              <Text as="p" variant="bodySm" tone="subdued">
                No collections found.
              </Text>
            )}
          </BlockStack>
        </BlockStack>
      </div>
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <InlineStack align="end" gap="200">
          <Button variant="tertiary" onClick={closeCollectionPicker}>
            Cancel
          </Button>
          <Button variant="primary" onClick={applyCollectionSelection}>
            Apply
          </Button>
        </InlineStack>
      </div>
    </div>
  );
}
