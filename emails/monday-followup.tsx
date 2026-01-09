import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Hr,
} from '@react-email/components'

interface MondayFollowupEmailProps {
  weekNumber: number
  numericData: {
    revenue: number
    hours: number
    satisfaction: number
    energy: number
  }
  narrativeHighlight?: string
}

export default function MondayFollowupEmail({
  weekNumber,
  numericData,
  narrativeHighlight,
}: MondayFollowupEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Week {weekNumber} Recap</Text>

          <Text style={paragraph}>
            Here's what you logged last week.
          </Text>

          <Hr style={hr} />

          <table style={table}>
            <tbody>
              <tr>
                <td style={tableLabel}>Revenue</td>
                <td style={tableValue}>${numericData.revenue.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={tableLabel}>Hours</td>
                <td style={tableValue}>{numericData.hours}</td>
              </tr>
              <tr>
                <td style={tableLabel}>Satisfaction</td>
                <td style={tableValue}>{numericData.satisfaction}/10</td>
              </tr>
              <tr>
                <td style={tableLabel}>Energy</td>
                <td style={tableValue}>{numericData.energy}/10</td>
              </tr>
            </tbody>
          </table>

          {narrativeHighlight && (
            <>
              <Hr style={hr} />

              <Text style={highlight}>"{narrativeHighlight}"</Text>
            </>
          )}

          <Hr style={hr} />

          <Text style={paragraph}>
            Your next check-in arrives this week.
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

const table = {
  width: '100%',
  marginBottom: '24px',
}

const tableLabel = {
  fontSize: '14px',
  color: '#71717a',
  padding: '8px 0',
  borderBottom: '1px solid #e4e4e7',
}

const tableValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#000000',
  padding: '8px 0',
  textAlign: 'right' as const,
  borderBottom: '1px solid #e4e4e7',
}

const highlight = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#3f3f46',
  fontStyle: 'italic',
  padding: '16px',
  borderLeft: '4px solid #d4d4d8',
  backgroundColor: '#fafafa',
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
