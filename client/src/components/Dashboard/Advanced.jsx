import React from "react";
import Bookmarks, { BookmarksBasic } from "components/Analysis/Bookmarks";
import { TeacherDashboardChild } from "components/TeacherDashboardChild";
import Venn from "components/Analysis/NewCharts/Venn";
import Radial from "components/Analysis/NewCharts/Radial";
import NewParticipation from "components/Analysis/NewCharts/Participation";
import NewDetailedFeedback from "components/Analysis/NewCharts/DetailedFeedback";
import OverviewChart from "components/Analysis/Charts/Overview";
import { OverviewVideo, OverviewRange, OverviewButtons } from "components/Analysis/Overview";
import QuestionGenerator, { QuestionGeneratorBasic } from "components/Analysis/QuestionGenerator";
import ActionTracker, { ActionTrackerBasic } from "components/Analysis/ActionTracker";
import useFeedback from "provider/feedback";
import UpgradeBlock from "./UpgradeBlock";
import { useAuth } from "provider/auth";

function AdvancedDashboard({ dummyPlayer = false }) {
  const { activated } = useFeedback();
  const { user } = useAuth();

  const isAdvanced = user.feature_level === "advanced";

  return (
    <>
      <div className="teacher-dashboard">
        <div className="td-top">
          <div className="td-left">
            <TeacherDashboardChild className="td-overview">
              <div className="td-video">{isAdvanced ? <OverviewVideo dummyPlayer={dummyPlayer} /> : <OverviewVideo dummyPlayer={true} />}</div>
              <div className="td-linechart">
                <div className="td-linechart-inner">
                  <OverviewRange />
                  <OverviewChart active={activated.reduce((pv, cv) => ({ ...pv, [cv]: true }), {})} />
                  <OverviewButtons />
                </div>
              </div>
            </TeacherDashboardChild>
          </div>
          <div className="td-right">
            <div className="td-save">
              <TeacherDashboardChild className="td-save-content">
                {isAdvanced ? (
                  <Bookmarks />
                ) : (
                  <UpgradeBlock>
                    <BookmarksBasic />
                  </UpgradeBlock>
                )}
              </TeacherDashboardChild>
            </div>
            <div className="td-analytics">
              <div className="td-clickdist">
                <TeacherDashboardChild className="td-clickdist-content">
                  <div className="td-venn-content">
                    <Venn key={Date.now()} />
                  </div>
                  <div className="td-radial">
                    <Radial />
                  </div>
                </TeacherDashboardChild>
              </div>
              <div className="td-analytics-right">
                <div className="td-participation">
                  <TeacherDashboardChild className="td-participation-content">
                    <NewParticipation />
                  </TeacherDashboardChild>
                </div>
                <div className="td-detailed">
                  <TeacherDashboardChild className="td-detailed-content">
                    <NewDetailedFeedback />
                  </TeacherDashboardChild>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="td-bottom">
          <div className="td-questions">
            <TeacherDashboardChild>
              {isAdvanced ? (
                <QuestionGenerator />
              ) : (
                <UpgradeBlock>
                  <QuestionGeneratorBasic />
                </UpgradeBlock>
              )}
            </TeacherDashboardChild>
          </div>
          <div className="td-actions">
            <TeacherDashboardChild className="td-actions-tracker">
              {isAdvanced ? (
                <ActionTracker />
              ) : (
                <UpgradeBlock>
                  <ActionTrackerBasic />
                </UpgradeBlock>
              )}
            </TeacherDashboardChild>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdvancedDashboard;
