import { BarChart, Bar, Tooltip, XAxis, Cell, YAxis, ResponsiveContainer } from "recharts";

const colors = { difficult: "#ff7785", intersect: "#c84747", easy: "#ffbc55", boring: "#9F8CFF", engaging: "#69b9a6" };

export default function ({ active = {}, difficult, easy, boring, engaging }) {
  const data = React.useMemo(() => {
    return [
      { key: "difficult", name: "Difficult", Students: difficult },
      { key: "easy", name: "Easy", Students: easy },
      { key: "boring", name: "Boring", Students: boring },
      { key: "engaging", name: "Engaging", Students: engaging },
    ];
  }, [difficult, easy, boring, engaging]);

  return (
    <>
      <ResponsiveContainer id="students-barchart" width="80%" height="80%">
        <BarChart data={data}>
          <Tooltip separator=": " />
          <Bar dataKey="Students">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[entry.key]} fillOpacity={active[entry.key] ? 1 : 0.2} />
            ))}
          </Bar>
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} label={{}} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
