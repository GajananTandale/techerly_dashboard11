import React, { useRef, useState } from "react";
import InfoButton from "../InfoButton";
import { Overlay, Popover } from "react-bootstrap";

import useFeedback from "provider/feedback";
import Venn from "./Venn";
import Radial from "./Radial";
import Loader from "components/Loader";

function ClickDistribution() {
  const { lesson, data, refreshing } = useFeedback();
  const [show, setShow] = useState(false);
  const [hover, setHover] = useState(false);
  const handleMouseEnter = e => {
    setHover(true);
  };
  const handleMouseLeave = e => {
    setHover(false);
  };
  const handleClick = e => {
    setShow(s => !s);
  };
  const handleFocus = e => {
    setHover(true);
  };
  const handleBlur = e => {
    setHover(false);
  };
  const mainRef = useRef();
  const vennRef = useRef();
  const radialRef = useRef();

  if (lesson && data)
    return (
      <>
        <Overlay show={show || hover} placement="top" target={mainRef.current}>
          {props => (
            <Popover className="nd-popover top" id="popover-click-distrib" {...props}>
              <Popover.Content>
                <div className="mb-2">DEBE click distribution gives you a more clear idea about the student feedback distribution in different ways. In this section, you will see two reprsentations:</div>
                <div>1. Radial column chart which gives percentage distribution of the student feedback, and</div>
                <div>2. Venn diagram which gives you idea about student feedback behavior in the entire lecture or in the specific part of the lecture.</div>
              </Popover.Content>
            </Popover>
          )}
        </Overlay>
        <div className="nd-clickdistrib">
          <div className="nd-venn" ref={vennRef} key="venn-c">
            {refreshing ? <Loader asDiv /> : <Venn key="venn-1" />}
          </div>
          <div className="nd-radial" ref={radialRef} key="radial-c">
            {refreshing ? <Loader asDiv /> : <Radial key="radial-1" />}
          </div>
          <Overlay show={show || hover} placement="right" target={vennRef.current}>
            {props => (
              <Popover className="nd-popover right" {...props}>
                <Popover.Content>
                  <div className="mb-2">2. The Venn diagram can give you more details about the student feedback.</div>
                  <div className="mb-2">Example 1: Overlap in the Easy and Difficult circles tells you how many students clicked Difficult as well as Easy for the selected part of the lecture or in the entire lecture.</div>
                  <div>Example 2: Overlap between Difficult and Boring tells you how many students found the selected part of the lecture Difficult as well as Boring. </div>
                </Popover.Content>
              </Popover>
            )}
          </Overlay>
          <Overlay show={show || hover} placement="right" target={radialRef.current}>
            {props => (
              <Popover className="nd-popover right" {...props}>
                <Popover.Content>
                  <div className="mb-2">
                    1. The radial column chart gives you the percentage distribution for clicks of ‘Easy - Difficult’ and ‘Engaging - Boring’ pairs for the selected time duration. It also gives the number of students who has provided the feedback of a
                    specific variable
                  </div>
                  <div className="mb-2">
                    - E.g. In the chart below, between 0 and 50 min 64 students clicked Difficult and 24 students clicked Easy at least once in the lecture. Following is the percentage distribution of the clicks: Difficult (65%) and Easy (35%).
                  </div>
                  <div>
                    - The sum of percentage of ‘Easy - Difficult’ and ‘Boring - Engaging’ clicks will be equal to 100. However, it is important to also look at how many students out of the total number of students has provided feedback for the section
                    under consideration.
                  </div>
                </Popover.Content>
              </Popover>
            )}
          </Overlay>
        </div>
      </>
    );
  return null;
}

export default ClickDistribution;
