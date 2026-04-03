import { TrackingView } from "./tracking-view";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TrackingPage({ searchParams }: PageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const rawToken = resolvedParams.token;
  const token = Array.isArray(rawToken) ? rawToken[0] || "" : rawToken || "";

  return <TrackingView token={token} />;
}
