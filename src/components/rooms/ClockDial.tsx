"use client";

import { useRef } from "react";

// 24시간 원형 다이얼: 낮 12시가 맨 위, 0시(자정)가 맨 아래,
// 시계 방향으로 1시간 = 15도 (낮 시간대가 위쪽에 오도록 180도 회전)
const VIEW = 260;
const CX = 130;
const CY = 130;
const R_OUT = 100;
const R_IN = 64;
const LABEL_R = 114;
const LABEL_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];
const ROTATE = 180; // 0시를 아래로 보내는 회전 각도

function hourStartAngle(hour: number): number {
  return hour * 15 + ROTATE;
}

function point(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function segmentPath(hour: number): string {
  const pad = 0.8; // 세그먼트 사이 살짝 틈
  const a0 = hourStartAngle(hour) + pad;
  const a1 = hourStartAngle(hour + 1) - pad;
  const [x0o, y0o] = point(R_OUT, a0);
  const [x1o, y1o] = point(R_OUT, a1);
  const [x1i, y1i] = point(R_IN, a1);
  const [x0i, y0i] = point(R_IN, a0);
  return [
    `M ${x0o.toFixed(2)} ${y0o.toFixed(2)}`,
    `A ${R_OUT} ${R_OUT} 0 0 1 ${x1o.toFixed(2)} ${y1o.toFixed(2)}`,
    `L ${x1i.toFixed(2)} ${y1i.toFixed(2)}`,
    `A ${R_IN} ${R_IN} 0 0 0 ${x0i.toFixed(2)} ${y0i.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function HourLabels() {
  return (
    <>
      {LABEL_HOURS.map((h) => {
        const [x, y] = point(LABEL_R, hourStartAngle(h));
        return (
          <text
            key={h}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fontWeight="700"
            fill="#94a3b8"
          >
            {h}
          </text>
        );
      })}
    </>
  );
}

// 꾹 누른 채 드래그하면 시작~끝 시간이 시계 방향으로 이어져 선택된다
export function ClockDialInput({
  hours,
  onChange,
}: {
  hours: number[];
  onChange: (hours: number[]) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStartHour = useRef<number | null>(null);
  const selected = new Set(hours);

  const pointerInfo = (
    clientX: number,
    clientY: number
  ): { hour: number; radius: number } => {
    const svg = svgRef.current;
    if (!svg) return { hour: 0, radius: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * VIEW - CX;
    const y = ((clientY - rect.top) / rect.height) * VIEW - CY;
    const deg = (Math.atan2(y, x) * 180) / Math.PI;
    const clockDeg = (deg + 90 + 360) % 360; // 0도 = 맨 위
    const dialDeg = (clockDeg - ROTATE + 360) % 360; // 회전 보정
    return {
      hour: Math.floor(dialDeg / 15) % 24,
      radius: Math.hypot(x, y),
    };
  };

  const applyRange = (start: number, end: number) => {
    const span = (end - start + 24) % 24;
    const next: number[] = [];
    for (let i = 0; i <= span; i++) next.push((start + i) % 24);
    onChange(next);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      className="mx-auto w-full max-w-[16rem] touch-none select-none"
      onPointerDown={(e) => {
        e.preventDefault();
        const { hour, radius } = pointerInfo(e.clientX, e.clientY);
        // 링(도넛) 위에서 시작한 터치만 인식 — 한가운데/모서리 오터치 방지
        if (radius < R_IN - 18 || radius > R_OUT + 18) return;
        dragStartHour.current = hour;
        applyRange(hour, hour);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (dragStartHour.current === null) return;
        applyRange(
          dragStartHour.current,
          pointerInfo(e.clientX, e.clientY).hour
        );
      }}
      onPointerUp={() => {
        dragStartHour.current = null;
      }}
      onPointerCancel={() => {
        dragStartHour.current = null;
      }}
    >
      {Array.from({ length: 24 }, (_, h) => (
        <path
          key={h}
          d={segmentPath(h)}
          fill={selected.has(h) ? "#4f46e5" : "#eef2f7"}
        />
      ))}
      <HourLabels />
      <text
        x={CX}
        y={CY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="800"
        fill={hours.length > 0 ? "#4f46e5" : "#94a3b8"}
      >
        {hours.length > 0 ? `${hours.length}시간` : "드래그!"}
      </text>
    </svg>
  );
}

// 읽기 전용 결과 시계: 초록 = 전원 가능, 보라 = 일부 가능
export function ClockDialResult({
  counts,
  total,
}: {
  counts: number[];
  total: number;
}) {
  const fillFor = (count: number): string => {
    if (count <= 0) return "#eef2f7";
    if (total > 0 && count >= total) return "#10b981";
    return count / Math.max(total, 1) >= 0.5 ? "#818cf8" : "#c7d2fe";
  };

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      className="mx-auto w-full max-w-[16rem] select-none"
    >
      {Array.from({ length: 24 }, (_, h) => (
        <path key={h} d={segmentPath(h)} fill={fillFor(counts[h] ?? 0)} />
      ))}
      <HourLabels />
      <text
        x={CX}
        y={CY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="800"
        fill="#64748b"
      >
        {total > 0 ? `${total}명 기준` : ""}
      </text>
    </svg>
  );
}
