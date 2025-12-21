import { Frame, Navigation, TopBar } from "@shopify/polaris";
import { useLocation, useNavigate } from "@remix-run/react";
import { useCallback, useState } from "react";

type AppFrameProps = {
  shopDomain?: string;
  children: React.ReactNode;
};

const navItems = [
  { label: "Dashboard", url: "/app" },
  { label: "Menus", url: "/app/menus" },
  { label: "Settings", url: "/app/settings" }
];

export default function AppFrame({ shopDomain, children }: AppFrameProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

  const handleNavigate = useCallback(
    (url: string) => {
      setMobileNavigationActive(false);
      navigate(url);
    },
    [navigate]
  );

  const navigationMarkup = (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={navItems.map((item) => ({
          ...item,
          onClick: () => handleNavigate(item.url)
        }))}
      />
    </Navigation>
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={() => setMobileNavigationActive((open) => !open)}
      userMenu={
        <TopBar.UserMenu
          initials="S"
          name="Shop"
          detail={shopDomain ?? "Shop"}
          actions={[
            {
              items: [{ content: "Log out", url: "/auth/logout" }]
            }
          ]}
        />
      }
    />
  );

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={() => setMobileNavigationActive(false)}
    >
      {children}
    </Frame>
  );
}
