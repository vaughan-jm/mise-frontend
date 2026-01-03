import React from 'react';
import colors from '../../constants/colors';
import useLanguage from '../../hooks/useLanguage';
import MiseLogo from './MiseLogo';

/**
 * PricingModal - Modal for displaying pricing plans and upgrade options
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Object} props.plans - Plans object with basic/pro plan data
 * @param {Function} props.onSelectPlan - Callback when a plan is selected (receives plan name)
 * @param {string} [props.currentPlan] - Optional current plan name to highlight
 */
export default function PricingModal({ isOpen, onClose, plans, onSelectPlan, currentPlan }) {
  const { t } = useLanguage();

  if (!isOpen || !plans) return null;

  const planOrder = ['basic', 'pro'];
  const availablePlans = planOrder.filter(planKey => plans[planKey]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bg,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: colors.text,
        padding: '20px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
    >
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: colors.muted,
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
        aria-label="Close pricing modal"
      >
        {t.back}
      </button>
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <MiseLogo size={48} />
        <h2
          id="pricing-modal-title"
          style={{ fontSize: '22px', fontWeight: '600', margin: '16px 0 8px' }}
        >
          {t.upgrade} your plan
        </h2>
        <p style={{ color: colors.muted, fontSize: '14px', marginBottom: '24px' }}>
          Clean more recipes, save them forever
        </p>

        {availablePlans.map((planKey) => {
          const plan = plans[planKey];
          const isRecommended = planKey === 'pro';
          const isCurrent = currentPlan === planKey;

          return (
            <div
              key={planKey}
              style={{
                background: colors.card,
                borderRadius: '12px',
                border: `1px solid ${isRecommended ? colors.accent : colors.border}`,
                padding: '20px',
                marginBottom: '12px',
                textAlign: 'left',
                position: 'relative',
              }}
              role="article"
              aria-label={`${plan.name} plan`}
            >
              {isRecommended && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '16px',
                    background: colors.accent,
                    color: colors.bg,
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                  aria-label="Recommended plan"
                >
                  Recommended
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                  {plan.name || planKey}
                </h3>
                <span style={{ fontSize: '20px', fontWeight: '600' }}>
                  ${plan.price || '?'}
                  <span style={{ fontSize: '14px', color: colors.muted }}>
                    /{t.month}
                  </span>
                </span>
              </div>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 16px 0',
                }}
                aria-label={`${plan.name} features`}
              >
                {(plan.features || []).map((feature, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: '13px',
                      color: colors.muted,
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ color: colors.accent }} aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onSelectPlan(planKey)}
                disabled={isCurrent}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isCurrent
                    ? colors.cardHover
                    : isRecommended
                      ? colors.accent
                      : colors.cardHover,
                  color: isCurrent
                    ? colors.muted
                    : isRecommended
                      ? colors.bg
                      : colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isCurrent ? 'not-allowed' : 'pointer',
                }}
                aria-label={isCurrent ? `Current plan: ${plan.name}` : `Choose ${plan.name} plan`}
              >
                {isCurrent
                  ? t.current
                  : isRecommended
                    ? `Go ${plan.name}`
                    : `Get ${plan.name}`
                }
              </button>
            </div>
          );
        })}

        <p style={{ fontSize: '12px', color: colors.dim, marginTop: '16px' }}>
          {t.cancelAnytime}
        </p>
      </div>
    </div>
  );
}
