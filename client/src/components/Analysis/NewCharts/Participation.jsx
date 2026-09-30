import React from "react";
import Gauge from "components/Gauge";
import useFeedback from "provider/feedback";
import Loader from "components/Loader";

function Participation() {
  const { lesson, data, range, refreshing, activated } = useFeedback();

  const [value, setValue] = React.useState(0);
  const [validResponses, setValidResponses] = React.useState(0);
  const [totalResponses, setTotalResponses] = React.useState(0);

  React.useEffect(() => {
    const participation = data.participation;
    const participation_all = data.participation_all;

    if (participation && lesson && Array.isArray(lesson.watched)) {
      const participationSet = new Set();
      const validResponsesSet = new Set();

      (Array.isArray(activated) ? activated : []).forEach((a) => {
        if (a === "net_difficult") {
          if (Array.isArray(participation.easy)) participation.easy.forEach(participationSet.add, participationSet);
          if (Array.isArray(participation.difficult)) participation.difficult.forEach(participationSet.add, participationSet);
        } else if (a === "net_engaging") {
          if (Array.isArray(participation.engaging)) participation.engaging.forEach(participationSet.add, participationSet);
          if (Array.isArray(participation.boring)) participation.boring.forEach(participationSet.add, participationSet);
        } else {
          if (participation[a] && Array.isArray(participation[a])) participation[a].forEach(participationSet.add, participationSet);
        }
      });

      if (participation_all) {
        if (Array.isArray(participation_all.easy)) participation_all.easy.forEach(validResponsesSet.add, validResponsesSet);
        if (Array.isArray(participation_all.difficult)) participation_all.difficult.forEach(validResponsesSet.add, validResponsesSet);
        if (Array.isArray(participation_all.engaging)) participation_all.engaging.forEach(validResponsesSet.add, validResponsesSet);
        if (Array.isArray(participation_all.boring)) participation_all.boring.forEach(validResponsesSet.add, validResponsesSet);
      }

      setValidResponses(validResponsesSet.size);
      if (Array.isArray(lesson.watched)) lesson.watched.forEach(validResponsesSet.add, validResponsesSet);

      setTotalResponses(validResponsesSet.size);
      setValue(participationSet.size);
    }
  }, [data.participation, data.participation_all, activated, lesson ? lesson.watched : null]);

  if (lesson && data) {
    if (refreshing) return <Loader asDiv />;
    return (
      <>
        <div className="child-caption">Student Participation</div>
        <div className="td-participation-container">
          <div className="td-prt-col">
            <div className="nd-prt-info">
              <span>Responses between</span>
              <span className="range-meter">
                <div className="circle">
                  <div className="range">{range[0]}</div>
                </div>
                <div className="circle-dash"></div>
                <div className="circle">
                  <div className="range">{range[1]}</div>
                  <div className="text">min</div>
                </div>
              </span>
            </div>
            <div className="nd-prt-gauge">
              <Gauge value={value} total={validResponses} />
            </div>
          </div>
          <div className="td-prt-col">
            <div className="nd-prt-info">Total Responses</div>
            <div className="nd-prt-gauge">
              <Gauge value={validResponses} total={totalResponses} />
            </div>
          </div>
        </div>
      </>
    );
  }
  return null;
}

export default Participation;
