type Props = {
  title: string;
  headerExtra?: React.ReactNode;
  bodyStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export default function Card({ title, headerExtra, bodyStyle, style, children }: Props) {
  return (
    <div className="admin-card" style={style}>
      <div className="admin-card-header">
        <h2>{title}</h2>
        {headerExtra}
      </div>
      <div className="admin-card-body" style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}
