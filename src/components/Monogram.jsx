// "GTD" monogram for the navbar, in the live "VI" mark's place (its viewBox is 46×35).
// Set in Barlow Condensed 900 and squeezed to the same box, so it fills the slot the same way.
export default function Monogram(props) {
  return (
    <svg viewBox="0 0 46 35" aria-hidden="true" focusable="false" {...props}>
      <text
        x="23"
        y="33.5"
        textAnchor="middle"
        textLength="46"
        lengthAdjust="spacingAndGlyphs"
        fill="currentColor"
        style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 46.5 }}
      >
        GTD
      </text>
    </svg>
  )
}
