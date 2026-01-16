import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Hr,
} from '@react-email/components'

interface MagicLinkEmailProps {
  magicLink: string
  isNewUser?: boolean
}

export default function MagicLinkEmail({
  magicLink,
  isNewUser = false,
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>
            {isNewUser ? 'Welcome to Weekly Reality Check' : 'Your Weekly Check-In'}
          </Text>

          <Text style={paragraph}>
            {isNewUser
              ? "You signed up for Weekly Reality Check. No onboarding, no tutorial, just the work."
              : "It's time for your weekly check-in."}
          </Text>

          <Text style={paragraph}>
            Click the link below to answer this week&apos;s questions. Takes 5-10 minutes.
          </Text>

          <Link href={magicLink} style={link}>
            Open Check-In →
          </Link>

          <Hr style={hr} />

          <Text style={footer}>
            This link expires in 7 days and can only be used once.
          </Text>

          <Text style={footer}>
            Weekly Reality Check · weeklyrealitycheck.com
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'monospace',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#000000',
  marginBottom: '24px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#3f3f46',
  marginBottom: '16px',
}

const link = {
  fontSize: '16px',
  color: '#000000',
  textDecoration: 'underline',
  display: 'inline-block',
  marginTop: '16px',
  marginBottom: '32px',
}

const hr = {
  borderColor: '#e4e4e7',
  margin: '32px 0',
}

const footer = {
  fontSize: '12px',
  color: '#a1a1aa',
  marginTop: '8px',
}
