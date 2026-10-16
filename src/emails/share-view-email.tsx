import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface ShareViewEmailProps {
  userName: string;
  handle: string;
  viewerIp: string;
  viewerUa: string;
  shareUrl?: string;
}

export function ShareViewEmail({
  userName,
  handle,
  viewerIp,
  viewerUa,
  shareUrl = "http://localhost:3000/",
}: ShareViewEmailProps) {
  // Truncate long user agents for readability.
  const ua = viewerUa.length > 80 ? viewerUa.slice(0, 80) + "…" : viewerUa;
  return (
    <Html>
      <Head />
      <Preview>Someone viewed your shared audit for {handle}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>TikTok Monetization Checker</Heading>
          </Section>
          <Section style={card}>
            <Heading style={h1}>Your share link was viewed 🔗</Heading>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              Someone just opened the share link you created for{" "}
              <span style={handleStyle}>{handle}</span>.
            </Text>
            <Section style={summaryBox}>
              <Text style={summaryRow}>
                <strong>Handle:</strong> {handle}
              </Text>
              <Text style={summaryRow}>
                <strong>Viewer IP:</strong>{" "}
                <code style={code}>{viewerIp}</code>
              </Text>
              <Text style={summaryRow}>
                <strong>User agent:</strong> {ua}
              </Text>
              <Text style={summaryRow}>
                <strong>When:</strong>{" "}
                {new Date().toLocaleString("en-US")}
              </Text>
            </Section>
            <Text style={paragraph}>
              If you didn&apos;t expect this view, you can revoke the share
              link from your Settings → Share Tokens page.
            </Text>
            <Section style={ctaSection}>
              <a href={shareUrl} style={ctaButton}>
                Open share link
              </a>
            </Section>
            <Hr style={hr} />
            <Text style={footer}>
              You&apos;re receiving this because you created a public share
              link for {handle} on TikTok Monetization Checker.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ShareViewEmail;

const body: React.CSSProperties = {
  backgroundColor: "#060b13",
  margin: 0,
  padding: "32px 0",
  fontFamily: "Inter, system-ui, sans-serif",
};
const container: React.CSSProperties = { maxWidth: "560px", margin: "0 auto", padding: 0 };
const header: React.CSSProperties = { textAlign: "center", padding: "24px 0" };
const logo: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#00f2fe",
  margin: 0,
  letterSpacing: "-0.01em",
};
const card: React.CSSProperties = {
  backgroundColor: "#0d1626",
  border: "1px solid #1a2942",
  borderRadius: "16px",
  padding: "32px",
};
const h1: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#ffffff",
  margin: "0 0 16px 0",
};
const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#cbd5e1",
  margin: "12px 0",
};
const summaryBox: React.CSSProperties = {
  backgroundColor: "#080e19",
  border: "1px solid #1a2942",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};
const summaryRow: React.CSSProperties = {
  fontSize: "13px",
  color: "#e2e8f0",
  margin: "4px 0",
  lineHeight: 1.5,
};
const handleStyle: React.CSSProperties = { color: "#00f2fe", fontWeight: 600 };
const code: React.CSSProperties = {
  backgroundColor: "#1e293b",
  color: "#e2e8f0",
  padding: "2px 6px",
  borderRadius: "4px",
  fontSize: "12px",
  fontFamily: "monospace",
};
const ctaSection: React.CSSProperties = { textAlign: "center", margin: "24px 0 8px 0" };
const ctaButton: React.CSSProperties = {
  display: "inline-block",
  backgroundImage: "linear-gradient(90deg, #fe2c55 0%, #ff527b 45%, #00f2fe 100%)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "10px",
};
const hr: React.CSSProperties = { borderColor: "#1a2942", margin: "24px 0" };
const footer: React.CSSProperties = { fontSize: "12px", color: "#64748b", lineHeight: 1.5 };
