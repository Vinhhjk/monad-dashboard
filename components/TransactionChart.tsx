'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, DotProps } from 'recharts';

interface TransactionChartProps {
  chartData: { time: string; count: number }[];
  queueLength: number;
}
type CustomHeadDotProps = DotProps & { data: { time: string; count: number }[] };

// Custom dot for the head of the line
function CustomHeadDot(props: CustomHeadDotProps) {
    const { cx, cy, data } = props;
    // Only render the image at the last data point
    if (data.length === 0 || typeof cx !== 'number' || typeof cy !== 'number') return null;
  
    // Instead of using 'any', use a type assertion for points
    const points = (props as DotProps & { points?: { x: number; y: number }[] }).points;
    const lastPoint = points ? points[data.length - 1] : undefined;
    const isLast =
      lastPoint &&
      Math.abs(cx - lastPoint.x) < 1e-3 &&
      Math.abs(cy - lastPoint.y) < 1e-3;
  
    if (!isLast) return null;
  
    return (
      <image
        x={cx - 36}
        y={cy - 12}
        href="/moyaki.webp"
        width={48}
        height={48}
        style={{ pointerEvents: 'none' }}
      />
    );
  }
export function TransactionChart({ chartData, queueLength }: TransactionChartProps) {
    return (
      <>
        <h2 className="text-xl font-semibold mb-2">📈 TX Volume (last 10 blocks)</h2>
        <div className="mb-4 text-sm text-gray-600">
          Queue: {queueLength} transactions pending
        </div>
        <div className="bg-white rounded-lg shadow-lg p-4">
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData}>
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={3}
                dot={false}
                activeDot={<CustomHeadDot data={chartData} />}
              />
              {/* Render the custom dot at the head */}
              {chartData.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="none"
                  dot={dotProps => {
                    const { key, ...rest } = dotProps;
                    return <CustomHeadDot key={key} {...rest} data={chartData} />;
                  }}                
                  legendType="none"
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>
    );
}
