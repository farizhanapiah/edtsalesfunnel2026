import {
  Html, Head, Body, Container, Section,
  Row, Column, Text, Hr,
} from '@react-email/components'

interface TopDeal {
  name:        string
  client:      string
  stage:       string
  value:       string
  probability: string
  weighted:    string
}

interface ActionDue {
  dealName: string
  action:   string
  dueDate:  string
  overdue:  boolean
}

interface WeeklySummaryEmailProps {
  reportType:       'monday' | 'friday'
  period:           string
  closedWonValue:   number
  weightedForecast: number
  totalPipeline:    number
  activeTarget:     number
  closedWonCount:   number
  staleDealsCount:  number
  topDeals:         TopDeal[]
  actionsThisWeek:  ActionDue[]
}

function formatRM(val: number) {
  if (val >= 1000000) return `RM${(val/1000000).toFixed(1)}M`
  if (val >= 1000)    return `RM${(val/1000).toFixed(0)}k`
  return `RM${val.toLocaleString()}`
}

export function WeeklySummaryEmail({
  reportType,
  period,
  closedWonValue,
  weightedForecast,
  totalPipeline,
  activeTarget,
  closedWonCount,
  staleDealsCount,
  topDeals,
  actionsThisWeek,
}: WeeklySummaryEmailProps) {
  const pctToTarget = activeTarget > 0
    ? Math.min(Math.round((closedWonValue / activeTarget) * 100), 100)
    : 0

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#0A0A0A', fontFamily: 'Arial, sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '20px auto' }}>

          {/* Header */}
          <Section style={{ backgroundColor: '#2D2DFF', padding: '24px 20px 20px' }}>
            <Text style={{ color: '#FFFFFF', margin: 0, fontSize: '22px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              EDT SALES {reportType === 'monday' ? '— WEEK KICKOFF' : '— WEEK REVIEW'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', margin: '6px 0 0', fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: '1px' }}>
              {period} · AUTO-GENERATED
            </Text>
          </Section>

          {/* KPI strip */}
          <Section style={{ border: '1px solid #FFFFFF', borderTop: 'none', backgroundColor: '#111111' }}>
            <Row style={{ padding: '16px 0' }}>
              {[
                { label: 'CLOSED WON MTD',  value: formatRM(closedWonValue),   color: '#22C55E' },
                { label: 'WEIGHTED FCST',   value: formatRM(weightedForecast),  color: '#2D2DFF' },
                { label: 'TOTAL PIPELINE',  value: formatRM(totalPipeline),     color: '#FFFFFF' },
              ].map(({ label, value, color }, i) => (
                <Column key={i} style={{ textAlign: 'center', borderRight: i < 2 ? '1px solid #333' : 'none' }}>
                  <Text style={{ color: '#8C8C8C', fontSize: '10px', textTransform: 'uppercase',
                    letterSpacing: '1px', margin: '0 0 4px' }}>{label}</Text>
                  <Text style={{ color, fontSize: '24px', fontWeight: 700, margin: 0 }}>{value}</Text>
                </Column>
              ))}
            </Row>
          </Section>

          {/* Target progress */}
          <Section style={{ backgroundColor: '#0A0A0A', border: '1px solid #333', borderTop: 'none', padding: '16px 20px' }}>
            <Text style={{ color: '#8C8C8C', fontSize: '10px', textTransform: 'uppercase',
              letterSpacing: '1px', margin: '0 0 8px' }}>
              TARGET PROGRESS — {pctToTarget}% ({formatRM(closedWonValue)} / {formatRM(activeTarget)})
            </Text>
            {/* Progress bar via table trick */}
            <Row>
              <Column style={{ width: `${pctToTarget}%`, height: '6px', backgroundColor: '#22C55E' }} />
              <Column style={{ height: '6px', backgroundColor: '#1a1a1a' }} />
            </Row>
          </Section>

          {/* Top deals */}
          {topDeals.length > 0 && (
            <Section style={{ marginTop: '8px', border: '1px solid #333', backgroundColor: '#0A0A0A' }}>
              <Text style={{ color: '#8C8C8C', fontSize: '10px', textTransform: 'uppercase',
                letterSpacing: '1px', margin: '12px 20px 8px', padding: 0 }}>
                TOP ACTIVE DEALS (BY WEIGHTED VALUE)
              </Text>
              {topDeals.map((deal, i) => (
                <Row key={i} style={{
                  borderTop: i > 0 ? '1px solid #1a1a1a' : 'none',
                  padding: '10px 20px',
                }}>
                  <Column>
                    <Text style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>
                      {deal.name}
                    </Text>
                    <Text style={{ color: '#8C8C8C', fontSize: '11px', margin: 0 }}>{deal.client}</Text>
                  </Column>
                  <Column style={{ textAlign: 'right' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>
                      {deal.value}
                    </Text>
                    <Text style={{ color: '#2D2DFF', fontSize: '11px', margin: 0 }}>
                      {deal.probability} · ~{deal.weighted}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          {/* Actions this week */}
          {actionsThisWeek.length > 0 && (
            <Section style={{ marginTop: '8px', border: '1px solid #333', backgroundColor: '#0A0A0A' }}>
              <Text style={{ color: '#8C8C8C', fontSize: '10px', textTransform: 'uppercase',
                letterSpacing: '1px', margin: '12px 20px 8px', padding: 0 }}>
                ACTIONS DUE THIS WEEK
              </Text>
              {actionsThisWeek.map((a, i) => (
                <Row key={i} style={{
                  borderTop: i > 0 ? '1px solid #1a1a1a' : 'none',
                  padding: '8px 20px',
                }}>
                  <Column>
                    <Text style={{ color: a.overdue ? '#EF4444' : '#F59E0B', fontSize: '11px',
                      textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>
                      {a.overdue ? '⚠ OVERDUE' : a.dueDate}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 600, margin: '0 0 2px' }}>
                      {a.dealName}
                    </Text>
                    <Text style={{ color: '#8C8C8C', fontSize: '11px', margin: 0 }}>{a.action}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          {/* Stale deals warning */}
          {staleDealsCount > 0 && (
            <Section style={{ marginTop: '8px', border: '1px solid #F59E0B',
              backgroundColor: '#1a0e00', padding: '12px 20px' }}>
              <Text style={{ color: '#F59E0B', fontSize: '12px', textTransform: 'uppercase',
                letterSpacing: '0.5px', fontWeight: 700, margin: 0 }}>
                ⚠ {staleDealsCount} STALE DEAL{staleDealsCount !== 1 ? 'S' : ''} — NO UPDATE IN 14+ DAYS
              </Text>
              <Text style={{ color: '#8C8C8C', fontSize: '11px', margin: '4px 0 0' }}>
                Log in to EDT Sales to update or close these deals before the next review.
              </Text>
            </Section>
          )}

          <Hr style={{ borderColor: '#222', margin: '20px 0 12px' }} />

          {/* Footer */}
          <Section>
            <Text style={{ color: '#333', fontSize: '10px', textAlign: 'center',
              textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              EDT SALES BOT · {period} · weareedt.com
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
