import React from "react";
import HeatmapSvg from "components/HeatmapSvg";
import useFeedback from "provider/feedback";
import { Range, getTrackBackground } from "react-range";

Radial.propTypes = {};

const COLORS = ["#c84747", "#ccc"];

const handleSliderTrack = (MIN, MAX, values = []) => ({ props, children }) => {
  const background = getTrackBackground({ values: values, colors: COLORS, min: MIN, max: MAX });
  return (
    <div onMouseDown={props.onMouseDown} onTouchStart={props.onTouchStart} className="nd-slider-track-container" style={props.style}>
      <div className="nd-slider-track" ref={props.ref} style={{ background }}>
        {children}
      </div>
    </div>
  );
};

const handleSliderThumb = (values = []) => ({ props, index }) => (
  <div {...props} className="nd-slider-thumb red" style={props.style}>
    {2 * (values[index] - 50)}
  </div>
);

function Radial(props) {
  const { data, threshold, setThreshold } = useFeedback();

  const STEP = 5;
  const MIN = 0;
  const MAX = 100;

  const handleSliderChange = v => {
    setThreshold(v[0]);
  };

  if (data && data.unique)
    return (
      <div className="nd-radial">
        <div className="nd-radial-heatmap">
          <div className="nd-radial-slider">
            <Range allowOverlap={false} draggableTrack={false} values={[threshold]} step={STEP} min={MIN} max={MAX} onChange={handleSliderChange} renderTrack={handleSliderTrack(MIN, MAX, [threshold])} renderThumb={handleSliderThumb([threshold])} />
          </div>
          <HeatmapSvg
            easy={data.unique.easy}
            easyAll={data.radial.easy}
            boring={data.unique.boring}
            boringAll={data.radial.boring}
            engaging={data.unique.engaging}
            engagingAll={data.radial.engaging}
            difficult={data.unique.difficult}
            difficultAll={data.radial.difficult}
            threshold={threshold}
          />
        </div>
      </div>
    );
  return null;
}

export default Radial;
