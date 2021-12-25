import React, { useState } from "react";
import InfoButton from "../InfoButton";
import { Popover, OverlayTrigger } from "react-bootstrap";
import DetailedFeedbackChart from "./Charts/DetailedFeedback";

const popover = (
  <Popover className="nd-popover left" id="popover-detailed-feed">
    <Popover.Content>
      <div className="mb-2">The heat map gives you the detailed reasons for a particular feedback for the part of the lecture based on the selection done by you using the two markers above the line chart. </div>
      <div>For example, the heat map of ‘Difficult’ gives you the percentage distribution of students’ reasons of difficulty in the lecture. </div>
      <div className="mb-2">
        Here, in this case, the time duration selected is entire lecture, i.e. 0 - 50 min, and the heat map of Difficult shows that lack of explanation has been reported as the primary reason of difficulty along with othe reasons such as Lack of prior
        knowledge and Slide design issue.
      </div>
      <div>
        Along with heat map, there is sub-section titled as other reasons. If student reason behind the feedback they are providing is not listed in the pop-up, then they can type in their reason on the feedback interface. Those reasons comes under Other
        reasons section.
      </div>
    </Popover.Content>
  </Popover>
);

function DetailedFeedback() {
  return (
    <>
      <div className="nd-detailed-feed-container">
        <DetailedFeedbackChart otherData={[]} />
      </div>
    </>
  );
}

export default DetailedFeedback;
