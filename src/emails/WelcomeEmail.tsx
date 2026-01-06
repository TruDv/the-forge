import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  firstName: string;
}

export const WelcomeEmail = ({ firstName }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>The furnaces must be heated red-hot.</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* HERO SECTION */}
        <Section style={heroSection}>
          <Heading style={h1}>Welcome, {firstName}.</Heading>
          <Text style={heroText}>
            You have chosen to step out of the crowd and into the fire.
          </Text>
        </Section>

        {/* CONTENT: THE MANIFESTO */}
        <Section style={contentSection}>
          <Text style={paragraph}>
            Today, the greatest challenge among the children of God is their failure to believe in His Word. This mindset is not faith; it is blindness.
          </Text>
          <Text style={paragraph}>
            By joining <strong>The Forge</strong>, you acknowledge that furnaces must be heated red-hot before the songs of deliverance can be sung. There is no dawn of salvation until the evening has deepened into midnight gloom.
          </Text>
          
          <div style={highlightBox}>
            <Text style={highlightText}>
              "We move from faith to stronger faith, from light to greater light, and from victory to victory—ever onward!"
            </Text>
          </div>

          <Text style={paragraph}>
            We stand at a crossroads where we must make a choice. You have chosen not to escape the world, but to conquer it through faith while living within it.
          </Text>
        </Section>

        <Hr style={hr} />

        {/* FOOTER */}
        <Section style={footer}>
          <Text style={footerText}>
            This email was sent from <strong>The Forge</strong>.<br />
            A sanctuary for prophetic charges and spiritual iron-sharpening.<br />
            Led by Puritan Charles.
          </Text>
          <Link href="https://theforge-community.com" style={footerLink}>
            Enter The Forge
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

// --- STYLES ---
const main = { backgroundColor: "#f8fafc", fontFamily: 'Georgia, serif' };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "40px 20px", maxWidth: "600px", borderRadius: "16px", border: "1px solid #e2e8f0" };
const heroSection = { textAlign: "center" as const, marginBottom: "32px" };
const h1 = { color: "#0f172a", fontSize: "32px", fontWeight: "900", textTransform: "uppercase" as const, fontStyle: "italic", margin: "0 0 16px" };
const heroText = { color: "#64748b", fontSize: "16px", fontWeight: "500", margin: "0" };
const contentSection = { marginBottom: "32px" };
const paragraph = { color: "#334155", fontSize: "16px", lineHeight: "26px", marginBottom: "20px" };
const highlightBox = { backgroundColor: "#fff7ed", borderLeft: "4px solid #f97316", padding: "20px", borderRadius: "8px", marginBottom: "24px" };
const highlightText = { color: "#9a3412", fontSize: "18px", fontStyle: "italic", fontWeight: "600", margin: "0" };
const hr = { borderColor: "#e2e8f0", margin: "20px 0" };
const footer = { textAlign: "center" as const };
const footerText = { color: "#94a3b8", fontSize: "12px", marginBottom: "16px", fontFamily: 'sans-serif' };
const footerLink = { color: "#6366f1", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" as const, textDecoration: "none", fontFamily: 'sans-serif' };