import React from "react";
import Gauge from "components/Gauge";
import useFeedback from "provider/feedback";
import Loader from "components/Loader";

function Participation() {
  const { lesson, data, range, refreshing } = useFeedback();
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (data.unique) {
      setValue(data.unique.users);
    }
  }, [data.unique]);

  if (lesson && data)
    return (
      <>
        {/* TODO: DEPRECATED */}
        <div className="nd-participation-container">
          {refreshing ? (
            <Loader asDiv />
          ) : (
            <div className="row justify-content-around">
              <div className="col-lg-4 nd-prt-col">
                <div className="nd-prt-info">
                  Response between {range[0]} - {range[1]} min
                </div>
                <div className="nd-prt-gauge">
                  <Gauge value={value} total={(data.students_count && data.students_count.length) || 0} />
                </div>
              </div>
              <div className="col-lg-4 nd-prt-col">
                <div className="nd-prt-info">Total Responses</div>
                <div className="nd-prt-gauge">
                  <Gauge value={(data.students_count && data.students_count.length) || 0} total={lesson.watched.length} />
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  return null;
}

export default Participation;
