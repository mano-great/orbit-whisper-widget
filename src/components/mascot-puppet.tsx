import head from "@/assets/mascot-head.png";
import torso from "@/assets/mascot-torso.png";
import upperArm from "@/assets/mascot-upper-arm.png";
import forearm from "@/assets/mascot-forearm.png";
import hand from "@/assets/mascot-hand.png";
import ears from "@/assets/mascot-ears.png";
import thigh from "@/assets/mascot-thigh.png";
import shin from "@/assets/mascot-shin.png";
import foot from "@/assets/mascot-foot.png";

const sprite = (src: string) => <img src={src} alt="" draggable={false} />;

/** Nested joints keep elbows, wrists, knees and ankles attached while moving. */
export function MascotPuppet({ crying, speaking }: { crying: boolean; speaking: boolean }) {
  return <span className="mascot-art" data-crying={crying} data-speaking={speaking} role="img" aria-label="Orange assistant character">
    <span className="puppet-body">
      {(["left", "right"] as const).map((side) => <span key={side} className={`puppet-leg puppet-leg-${side}`}>
        {sprite(thigh)}
        <span className="puppet-knee">{sprite(shin)}<span className="puppet-foot">{sprite(foot)}</span></span>
      </span>)}
      <span className="puppet-torso">{sprite(torso)}</span>
      {(["left", "right"] as const).map((side) => <span key={side} className={`puppet-arm puppet-arm-${side}`}>
        {sprite(upperArm)}
        <span className="puppet-elbow">{sprite(forearm)}<span className="puppet-hand">{sprite(hand)}</span></span>
      </span>)}
      <span className="puppet-neck"><span className="puppet-head">
        {sprite(head)}
        <span className="puppet-ears">{sprite(ears)}</span>
        <span className="mascot-face" aria-hidden="true">
          <span className="mascot-eye mascot-eye-left"><i /></span>
          <span className="mascot-eye mascot-eye-right"><i /></span>
          <span className="mascot-mouth" />
          {crying && <><span className="mascot-tear mascot-tear-left" /><span className="mascot-tear mascot-tear-right" /></>}
        </span>
      </span></span>
    </span>
  </span>;
}