"use client";
import type { MenuProps } from "antd";
import { Layout, Menu } from "antd";
import Sider from "antd/es/layout/Sider";
const { Header, Content } = Layout;
import { WagmiProvider } from "wagmi";
import { config } from "../config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConnectKitProvider, ConnectKitButton } from "connectkit";
import { useRouter } from "next/navigation";

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group"
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const items: MenuProps["items"] = [
  getItem("Lend", "lend"),
  getItem("Borrow", "borrow"),
  getItem("My loans", "my_loans"),
];

const queryClient = new QueryClient();

export default function CustomLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  return (
    <AntdRegistry>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ConnectKitProvider>
            <Layout className="h-screen">
              <Header
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 10,
                }}
              >
                <img
                  className="h-full w-auto"
                  src="https://velocityglobal.com/sites/default/files/image/2023-10/Consensys-Logo-Chartreuse.png"
                />
                <ConnectKitButton />
              </Header>
              <Layout>
                <Sider width={200}>
                  <Menu
                    style={{ height: "100%", borderRight: 0 }}
                    defaultSelectedKeys={["lend"]}
                    items={items}
                    onClick={(e) => router.push(`/${e.key}`)}
                  />
                </Sider>
                <Layout style={{ padding: "0 24px 24px" }}>
                  <Content
                    style={{
                      padding: 24,
                      margin: 0,
                      minHeight: 280,
                    }}
                  >
                    {children}
                  </Content>
                </Layout>
              </Layout>
            </Layout>
          </ConnectKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </AntdRegistry>
  );
}
