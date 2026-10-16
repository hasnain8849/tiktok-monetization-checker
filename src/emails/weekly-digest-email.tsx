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

export interface WeeklyDigestEmailProps {
  userName: string;
  totalAudits: number;
  eligibleCount: number;
  restrictedCount: number;
  newUnlocks: number;
  /** Top 3 most-changed handles with their status (free-formatted strings). */
  topHandles: { handle: string; status: string; followers: number }[];
  dashboardUrl?: string;
}

export function WeeklyDigestEmail({
  userName,
  totalAudits,
  eligibleCount,
  restrictedCount,
  newUnlocks,
  topHandles,
  dashboardUrl = "http://localhost:3000/",
}: WeeklyDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your weekly TikTok audit digest</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>TikTok Monetization Checker</Heading>
          </Section>
          <Section style={card}>
            <Heading style={h1}>Your weekly digest</Heading>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              Here&apos;s a snapshot of your saved TikTok profile audits from
              the past week:
            </Text>
            <Section style={summaryBox}>
              <Text style={summaryRow}>
                <strong>Total saved audits:</strong> {totalAudits}
              </Text>
              <Text style={summaryRow}>
                <strong>Eligible:</strong> {eligibleCount}
              </Text>
              <Text style={summaryRow}>
                <strong>Restricted:</strong> {restrictedCount}
              </Text>
              <Text style={summaryRow}>
                <strong>New unlocks this week:</strong> {newUnlocks}
              </Text>
            </Section>

            {topHandles.length > 0 && (
              <Section>
                <Text style={subhead}>Top handles:</Text>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>Handle</th>
                      <th style={th}>Status</th>
                      <th style={th}>Followers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topHandles.map((h) => (
                      <tr key={h.handle}>
                        <td style={td}>{h.handle}</td>
                        <td style={td}>{h.status}</td>
                        <td style={td}>{h.followers.toLocaleString("en-US")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            <Section style={ctaSection}>
              <a href={dashboardUrl} style={ctaButton}>
                Open dashboard
              </a>
            </Section>
            <Hr style={hr} />
            <Text style={footer}>
              You&apos;re receiving this because you saved an audit on TikTok
              Monetization Checker. To stop receiving these digests, disable
              &quot;Eligibility alert emails&quot; in your settings.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WeeklyDigestEmail;

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
const subhead: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#94a3b8",
  margin: "16px 0 8px 0",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};
const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: "12px",
  color: "#94a3b8",
  padding: "8px",
  borderBottom: "1px solid #1a2942",
};
const td: React.CSSProperties = {
  fontSize: "13px",
  color: "#e2e8f0",
  padding: "8px",
  borderBottom: "1px solid #1a2942",
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
