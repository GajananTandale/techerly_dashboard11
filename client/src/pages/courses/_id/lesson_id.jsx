import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { useParams } from "react-router-dom";
import { isMobile, isBrowser, BrowserView, MobileView, withOrientationChange } from "react-device-detect";
import Layout from "components/Layout";
import screenfull from "screenfull";
import { CgClose } from "react-icons/cg";
import { useAuth } from "provider/auth";
import Loader from "components/Loader";

const playerOptions = {
  youtube: {
    embedOptions: {
      host: "https://www.youtube-nocookie.com"
    },
    playerVars: {
      modestbranding: 1,
      fs: 0,
      iv_load_policy: 3,
      autohide: 0,
      autoplay: 1
    }
  }
};

const mobilePlayerOptions = {
  youtube: {
    embedOptions: {
      host: "https://www.youtube-nocookie.com"
    },
    playerVars: {
      modestbranding: 1,
      fs: 1,
      iv_load_policy: 3,
      autohide: 0,
      autoplay: 1
    }
  }
};

const options = {
  easy: [
    { id: "good-exp", name: "Good explanation" },
    { id: "enough-bg-concept", name: "Enough background to understand the topic / concept" },
    { id: "easy-understand", name: "Easy to understand" },
    { id: "well-prep-presentation", name: "Well-prepared presentation" },
    { id: "good-presentation", name: "Good presentation style" }
  ],
  difficult: [
    { id: "lack-explanation", name: "Lack of explanation" },
    { id: "new-concept", name: "New concept for me" },
    { id: "difficult-understand", name: "Too difficult to understand" },
    { id: "issue-blackboard-writing", name: "Issue with slide / blackboard writing" },
    { id: "no-reallife-example", name: "No exposure to real-life examples" },
    { id: "too-fast", name: "Too fast" }
  ],
  boring: [
    { id: "not-explained-properly", name: "Not explained properly" },
    { id: "difficult-content", name: "Too challenging / difficult content" },
    { id: "easy-content", name: "Too easy content" },
    { id: "not-meaningful", name: "Content not meaningful for me" },
    { id: "bored-in-general", name: "I am bored in general" },
    { id: "presentation-stlye", name: "Presentation style of the teacher" },
    { id: "too-much-repetition", name: "Too much repetition" },
    { id: "too-slow", name: "Too slow" }
  ],
  engaging: [
    { id: "good-exp", name: "Good explanation" },
    { id: "practical-applications", name: "Practical applications are discussed" },
    { id: "idea-about-content", name: "I have some idea about the topic / content" },
    { id: "ci-examples", name: "Counter-intuitive examples / explanation" },
    { id: "presentation-style", name: "Presentation style of the teacher" }
  ]
};

const playerStyles = {};

function CourseIdLessonId(props) {
  const { user, request } = useAuth();
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const { isLandscape, isPortrait } = props;
  const videoId = "7PXyg2r-k2c";
  const lessonName = "Fluid Mechanics Lecture 1 | Introduction";
  const lessonDescription = "Voluptatum sit ipsa nulla fuga placeat sint sed. Deleniti dolorem laboriosam corrupti rerum rerum vel eius ducimus.";
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [timestamp, settimestamp] = useState(0);
  const [overlay, setOverlay] = useState(false);
  const [data, setData] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  let subs = true;
  const fetchData = () => {
    setLoading(true);
    request("GET", "/lessons/" + id).then(({ data }) => {
      if (data && data.success && subs) {
        setLesson(data.lesson);
        setLoading(false);
      }
    });
  };
  useEffect(() => {
    fetchData();
    return () => (subs = false);
  }, []);
  const videoOnPlay = () => {
    setPlaying(true);
  };
  const videoOnReady = () => {};
  const videoOnPause = () => {
    setPlaying(false);
  };
  const videoOnBuffer = () => {
    setOverlay(false);
  };
  const videoOnBufferEnd = () => {
    setPlaying(true);
    // setOverlay(true);
  };

  const handleFeedback = key => e => {
    setPlaying(false);
    setData({
      feedback: key,
      timestamp
    });
  };

  const handleCaputureFeedback = key => e => {
    request(
      "POST",
      "/lessons/" + lesson.id,
      {
        ...data,
        feedback_type: key
      },
      { withCredentials: true }
    )
      .then(({ data }) => {})
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        setData(null);
        setPlaying(true);
      });
  };
  if (loading) return <Loader />;
  if (lesson)
    return (
      <Layout>
        <div className="container-fluid">
          <MobileView>{/* <MobilePlayer/> */}</MobileView>
          <BrowserView>
            <Player lesson={lesson} />
          </BrowserView>
        </div>
      </Layout>
    );
  return null;
}

// function MobilePlayer({ lesson, isPortrait, isLandscape, videoOnBuffer, videoOnBufferEnd, videoOnPause, videoOnPlay, videoOnReady, playing }) {
//   const mobilePlayerRef = useRef();
//   const [overlay, setOverlay] = useState(false);

//   const handleOverlayClick = e => {
//     e.preventDefault();
//     setOverlay(false);
//   };

//   useEffect(() => {
//     if (isLandscape && mobilePlayerRef && mobilePlayerRef.current) {
//       // alert(JSON.stringify(Object.keys(mobilePlayerRef.current.player)));
//       if (mobilePlayerRef.current.getInternalPlayer()) {
//         const node = mobilePlayerRef.current.getInternalPlayer().f;
//         if (playing) {
//           // screenfull.request(node);
//         } else {
//           if (screenfull.isEnabled) {
//             screenfull.exit();
//           }
//         }
//       }
//     }
//   }, [mobilePlayerRef, isLandscape, playing]);
//   if (!lesson) return null;
//   if (isPortrait)
//     return (
//       <div className="feedback-mobile portrait">
//         <div className="feedback-mobile-player">
//           <ReactPlayer
//             muted
//             onBufferEnd={videoOnBufferEnd}
//             onBuffer={videoOnBuffer}
//             onPause={videoOnPause}
//             onReady={videoOnReady}
//             onPlay={videoOnPlay}
//             playing={playing}
//             height="100%"
//             width="100%"
//             style={playerStyles}
//             controls
//             config={playerOptions}
//             url={"https://www.youtube.com/watch?v=7PXyg2r-k2c"}
//           />
//         </div>
//         <div className="lesson-details">
//           <div className="lesson-name">{lesson.name}</div>
//         </div>
//         <div className="feedback-system">
//           <div className="redline" />
//           <div className="row justify-content-center feedback-top">
//             <div className="btn btn-danger btn-lg btn-feedback">Difficult</div>
//           </div>
//           <div className="row justify-content-between feedback-middle">
//             <div className="blueline" />
//             <div className="btn btn-primary btn-lg btn-feedback">Boring</div>
//             <div className="btn btn-primary btn-lg btn-feedback">Engaging</div>
//           </div>
//           <div className="row justify-content-center feedback-bottom">
//             <div className="btn btn-danger btn-lg btn-feedback">Easy</div>
//           </div>
//         </div>
//       </div>
//     );
//   return (
//     <div className="feedback-mobile landscape">
//       <div className="feedback-mobile-player">
//         <ReactPlayer
//           ref={mobilePlayerRef}
//           muted
//           onBufferEnd={videoOnBufferEnd}
//           onBuffer={videoOnBuffer}
//           onPause={videoOnPause}
//           onReady={videoOnReady}
//           onPlay={videoOnPlay}
//           onProgress={({ playedSeconds }) => {
//             settimestamp(Math.round(playedSeconds));
//           }}
//           onDuration={duration => {
//             setVideoDuration(duration);
//           }}
//           playing={playing}
//           height="100%"
//           width="100%"
//           style={playerStyles}
//           controls
//           config={mobilePlayerOptions}
//           url={"https://youtu.be/7PXyg2r-k2c"}
//         />
//       </div>
//     </div>
//   );
// }

function Player({ lesson }) {
  const playerRef = useRef();
  const [playing, setPlaying] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [data, setData] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const { request } = useAuth();

  const videoOnPlay = () => {
    setPlaying(true);
  };
  const videoOnReady = () => {};
  const videoOnPause = () => {
    setPlaying(false);
  };
  const videoOnBuffer = () => {
    setOverlay(false);
  };
  const videoOnBufferEnd = () => {
    setPlaying(true);
    // setOverlay(true);
  };

  const handleFeedback = key => e => {
    setPlaying(false);
    setData({
      feedback: key,
      timestamp
    });
  };

  const handleCaputureFeedback = key => e => {
    request("POST", "/lessons/" + lesson.id, { ...data, feedback_type: key }, { withCredentials: true })
      .then(({ data }) => {})
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        setData(null);
        setPlaying(true);
      });
  };
  const handleOverlayClick = e => {
    e.preventDefault();
    setOverlay(false);
  };
  if (!lesson) return null;
  return (
    <div className="row">
      <div className="col-md-9 col-lg-8 feedback-player">
        {overlay && !playing && (
          <div className="overlay-play" onClick={handleOverlayClick}>
            <div className="close-icon" onClick={handleOverlayClick}>
              <i className="fas fa-times" />
            </div>
          </div>
        )}
        <ReactPlayer
          ref={playerRef}
          onBufferEnd={videoOnBufferEnd}
          onBuffer={videoOnBuffer}
          onPause={videoOnPause}
          onReady={videoOnReady}
          onPlay={videoOnPlay}
          playing={playing}
          height="100%"
          width="100%"
          onProgress={({ playedSeconds }) => {
            setTimestamp(playedSeconds);
          }}
          onDuration={duration => {
            setVideoDuration(duration);
          }}
          style={playerStyles}
          controls
          config={playerOptions}
          url={lesson.youtube_link}
        />
      </div>
      <div className="col-md-3 col-lg-4 card feedback-recorder">
        {!data ? (
          <div className="card-body feedback-card">
            <div className="feedback-text text-center ">I find the lecture</div>
            <div className="feedback-system container-fluid">
              <div className="redline" />
              <div className="row justify-content-center feedback-top">
                <div className="btn btn-danger btn-lg btn-feedback btn-difficult" onClick={handleFeedback("difficult")}>
                  Difficult
                </div>
              </div>
              <div className="row justify-content-between feedback-middle">
                <div className="blueline" />
                <div className="btn btn-primary btn-lg btn-feedback btn-boring" onClick={handleFeedback("boring")}>
                  Boring
                </div>
                <div className="btn btn-primary btn-lg btn-feedback btn-engaging" onClick={handleFeedback("engaging")}>
                  Engaging
                </div>
              </div>
              <div className="row justify-content-center feedback-bottom">
                <div className="btn btn-danger btn-lg btn-feedback btn-easy" onClick={handleFeedback("easy")}>
                  Easy
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-body feedback-card">
            <div className="d-flex justify-content-end mb-2">
              <CgClose size="28" onClick={handleCaputureFeedback()} />
            </div>
            {data.feedback && (
              <>
                {options[data.feedback].map((o, k) => (
                  <div className="card my-2" stlye={{ cursor: "pointer" }} onClick={handleCaputureFeedback(o.id)} key={k}>
                    <div className="card-body text-center">{o.name}</div>
                  </div>
                ))}
                <div className="card my-2" stlye={{ cursor: "pointer" }} onClick={handleCaputureFeedback("other")} key="other">
                  <div className="card-body text-center">Other</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default withOrientationChange(CourseIdLessonId);
