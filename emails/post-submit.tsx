import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Hr,
} from '@react-email/components'

interface PostSubmitEmailProps {
  weekNumber: number
  numericData: {
    revenue: number
    hours: number
    satisfaction: number
    energy: number
  }
  aiSummary?: string
}

export default function PostSubmitEmail({
  weekNumber,
  numericData,
  aiSummary,
}: PostSubmitEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Check-In Submitted</Text>

          <Text style={paragraph}>
            Week {weekNumber} is logged.
          </Text>

          <Hr style={hr} />

          <Text style={sectionHeading}>Your Numbers</Text>

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

          {aiSummary && (
            <>
              <Hr style={hr} />

              <Text style={sectionHeading}>Pattern Summary</Text>

              <Text style={summaryBox}>{aiSummary}</Text>

              <Text style={disclaimer}>
                This summary describes patterns in your data. It does not make recommendations.
              </Text>
            </>
          )}

          <Hr style={hr} />

          <Text style={paragraph}>
            You'll receive a follow-up on Monday.
          </Text>

          <Text style={paragraph}>
            Next week's check-in will arrive at the same time.
          </Text>

          <Hr style={hr} />

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

const sectionHeading = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#000000',
  marginBottom: '16px',
  marginTop: '24px',
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

const summaryBox = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#3f3f46',
  backgroundColor: '#fafafa',
  padding: '16px',
  borderLeft: '4px solid #d4d4d8',
  marginBottom: '16px',
}

const disclaimer = {
  fontSize: '12px',
  color: '#a1a1aa',
  fontStyle: 'italic',
  marginTop: '8px',
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
