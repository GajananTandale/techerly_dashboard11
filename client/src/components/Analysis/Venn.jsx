import React from "react";

// const scheme1 = chroma.scale([colors.engaging, colors.difficult, colors.intersect, colors.boring, colors.intersect]).colors(5);
// const scheme2 = chroma.scale([colors.engaging, colors.easy, colors.intersect, colors.boring, colors.intersect]).colors(5);
// const scheme3 = chroma.scale([colors.difficult, colors.easy, colors.intersect]).colors(3);
// const scheme4 = chroma.scale([colors.engaging, colors.boring, colors.intersect]).colors(3);

// class Venn extends React.Component {
//   static contextType = FeedbackContext;
//   constructor() {
//     super();
//     this.state = {
//       venn1: null,
//       venn2: null,
//       venn3: null,
//       venn4: null
//     };
//   }
//   componentDidMount() {
//     const { data } = this.context;
//     if (data && data.venn) {
//       const { difficult = 0, easy = 0, boring = 0, engaging = 0, difficult_easy = 0, difficult_boring = 0, difficult_engaging = 0, engaging_easy = 0, boring_easy = 0, boring_engaging = 0 } = data.venn;
//       const v1 = [];
//       /**
//        * [
//           { key: ["Engaging"], data: engaging },
//           { key: ["Difficult"], data: difficult },
//           { key: ["Engaging", "Difficult"], data: difficult_engaging },
//           { key: ["Boring"], data: boring },
//           { key: ["Difficult", "Boring"], dat a: difficult_boring }
//         ]
//        */
//       if (difficult) {
//       }
//       this.setState({
//         venn1: v1
//       });
//       this.setState({
//         venn2: [
//           { key: ["Engaging"], data: engaging },
//           { key: ["Easy"], data: easy },
//           { key: ["Engaging", "Easy"], data: engaging_easy },
//           { key: ["Boring"], data: boring },
//           { key: ["Engaging", "Boring"], data: boring_easy }
//         ]
//       });
//       this.setState({
//         venn3: [
//           { key: ["Difficult"], data: difficult },
//           { key: ["Easy"], data: easy },
//           { key: ["Difficult", "Easy"], data: difficult_easy }
//         ]
//       });
//       this.setState({
//         venn4: [
//           { key: ["Engaging"], data: engaging },
//           { key: ["Boring"], data: boring },
//           { key: ["Engaging", "Boring"], data: boring_engaging }
//         ]
//       });
//     }
//   }

//   render() {
//     const { venn1, venn2, venn3, venn4 } = this.state;
//     const { data } = this.context;
//     if (!data) return null;
//     if (venn1 || venn2 || venn3 || venn4)
//       return (
//         <>
//           <div className="nd-venn-width">
//             {venn1 && <VennDiagram type="euler" data={venn1} series={<VennSeries animated={false} arc={<VennArc gradient={null} initialStyle={{ opacity: 0.8 }} />} colorScheme={scheme1} label={<VennLabel labelType="value" />} />} />}
//           </div>
//           <div className="nd-venn-width">
//             {venn2 && <VennDiagram type="euler" data={venn2} series={<VennSeries animated={false} arc={<VennArc gradient={null} initialStyle={{ opacity: 0.8 }} />} colorScheme={scheme2} label={<VennLabel labelType="value" />} />} />}
//           </div>
//           <div className="nd-venn-width">
//             {venn3 && (
//               <VennDiagram
//                 type="euler"
//                 data={venn3}
//                 series={<VennSeries animated={false} arc={<VennArc gradient={null} initialStyle={{ opacity: 0.8 }} />} colorScheme={scheme3} label={<VennLabel labelType="value" />} outerLabel={<VennOuterLabel format={data => data.value} />} />}
//               />
//             )}
//             {venn4 && <VennDiagram type="euler" data={venn4} series={<VennSeries animated={false} arc={<VennArc gradient={null} initialStyle={{ opacity: 0.8 }} />} colorScheme={scheme4} label={<VennLabel labelType="value" />} />} />}
//           </div>
//         </>
//       );
//     return <div className="d-flex justify-content-center align-items-center w-100">No data...</div>;
//   }
// }

// TODO: Replace with other component
// https://www.anychart.com/technical-integrations/samples/react-charts/
// https://docs.anychart.com/Basic_Charts/Venn_Diagram

function Venn() {
  return <div className="d-flex justify-content-center align-items-center w-100">No data...</div>;
}

// class ErrorBoundary extends React.Component {
//   constructor() {
//     super();
//     this.state = { hasError: false };
//   }

//   static getDerivedStateFromError(error) {
//     return { hasError: true };
//   }

//   componentDidCatch(error, errorInfo) {}

//   render() {
//     if (this.state.hasError) {
//       // You can render any custom fallback UI
//       return <div className="d-flex justify-content-center align-items-center w-100">No data...</div>;
//     }

//     return this.props.children;
//   }
// }

export default Venn;
