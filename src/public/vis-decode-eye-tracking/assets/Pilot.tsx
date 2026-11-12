import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Container, Group, Space, Text } from '@mantine/core';
import { StimulusParams } from '../../../store/types';
import Plot from '../../vis-decode-slider/assets/Plot';
import DistributionSlider from '../../vis-decode-slider/assets/chartComponents/DistributionSlider';
import { ScalesProvider } from '../../vis-decode-slider/assets/chartComponents/ScalesContext';
import { generateDistributionData, GeneralizedDistributionParams } from '../../vis-decode-slider/assets/dataGeneration/DistributionCalculations';
import { chart, landmarks, pixelX, pixelY, sampleY } from '../../../utils/eyeTrackingPilot';

type Task = 'cdf_curve' | 'cdf_axis' | 'pdf_peak' | 'pdf_area' | 'dot_axis';
interface Parameters { trialId: string; task: Task; practice: boolean; params: GeneralizedDistributionParams; dot: { x: number; y: number } }
interface TrialEvent { type: string; time: number; epoch: number; detail: unknown }

function Trial({ parameters, setAnswer }: StimulusParams<Parameters>) {
  const { task, practice, params, trialId, dot } = parameters;
  const data = useMemo(() => generateDistributionData(params), [params]);
  const targets = useMemo(() => landmarks(data), [data]);
  const pdf = task.startsWith('pdf');
  const axis = task === 'cdf_axis' || task === 'dot_axis';
  const target = task === 'dot_axis' ? dot.x : task === 'pdf_peak' ? targets.mode : targets.median;
  const [value, setValue] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const events = useRef<TrialEvent[]>([]);
  const selection = useRef<number | null>(null);
  const committed = useRef(false);
  const attempt = useRef(crypto.randomUUID());
  const publish = useRef(setAnswer);
  publish.current = setAnswer;

  const record = useCallback((type: string, detail: unknown = null) => {
    const time = performance.now();
    const event = { type, time, epoch: performance.timeOrigin + time, detail };
    events.current.push(event);
    publish.current({ status: committed.current, answers: {
      'pilot-record': JSON.stringify({ schemaVersion: 1, trialId, attemptId: attempt.current,
        task, practice, params, dot, target, landmarks: targets, chart, data,
        timeOrigin: performance.timeOrigin, value: selection.current,
        events: events.current }),
    } });
    // An external hardware bridge can subscribe to these markers and record device time.
    window.dispatchEvent(new CustomEvent('vis-decode-marker', { detail: { trialId, attemptId: attempt.current, ...event } }));
  }, [trialId, task, practice, params, dot, target, targets, data]);

  useEffect(() => {
    const geometry = () => {
      const svg = root.current?.querySelector('svg');
      const bounds = svg?.getBoundingClientRect();
      record('geometry', { bounds: bounds?.toJSON(), devicePixelRatio: window.devicePixelRatio,
        sliderBounds: root.current?.querySelector('[data-source="slider-check"]')?.getBoundingClientRect().toJSON(),
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scroll: { x: window.scrollX, y: window.scrollY },
        landmarksSvg: { mode: { x: pixelX(targets.mode), y: pixelY(sampleY(data, targets.mode, pdf)) },
          crossing: { x: pixelX(targets.median), y: pixelY(0.5) },
          reference: { x: 50, y: pixelY(0.5) }, axisTarget: { x: pixelX(target), y: 410 } },
      });
    };
    const frame = requestAnimationFrame(() => { record('chart_frame'); geometry(); });
    const visibility = () => record('visibility', document.visibilityState);
    const sync = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail && typeof detail.deviceTime === 'number' && Number.isFinite(detail.deviceTime)
        && typeof detail.device === 'string' && typeof detail.unit === 'string') {
        record('tracker_sync', { device: detail.device, deviceTime: detail.deviceTime, unit: detail.unit });
      }
    };
    const observer = new ResizeObserver(geometry);
    if (root.current) observer.observe(root.current);
    window.addEventListener('resize', geometry);
    window.addEventListener('scroll', geometry, true);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('vis-decode-tracker-sync', sync);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', geometry);
      window.removeEventListener('scroll', geometry, true);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('vis-decode-tracker-sync', sync);
    };
  }, [record, targets, target, data, pdf]);

  const change = (next: number, commit: boolean) => {
    const first = selection.current === null;
    selection.current = next;
    committed.current = commit;
    setValue(next);
    record(first ? 'first_selection' : commit ? 'slider_commit' : 'slider_change', { value: next, commit });
  };
  const marker = value === null ? null : { x: value, y: axis ? 0 : sampleY(data, value, pdf) };
  return (
    <Container size={680} p="md" ref={root}>
      <Text size="sm" c="dimmed">{practice ? 'Practice' : 'Trial'} · Adjust the slider, then select Next.</Text>
      <Space h="md" />
      <DistributionSlider value={value ?? 0} onChange={(next) => change(next, false)} onChangeEnd={(next) => change(next, true)} distributionData={data} width={535} />
      <Space h="lg" />
      <ScalesProvider {...chart} xDomain={[-5, 5]} yDomain={[0, 1]}>
        <Plot distributionData={data} showPDF={pdf} strokeColor={task === 'dot_axis' ? 'transparent' : '#2c7fb8'}
          selectedPoint={marker} axisLabels={{ x: 'Value', y: task === 'dot_axis' ? 'Value' : pdf ? 'Density' : 'Cumulative Probability' }}>
          {task === 'dot_axis' && <circle cx={pixelX(dot.x)} cy={pixelY(dot.y)} r={5} fill="#2c7fb8" />}
          {feedback && <line x1={pixelX(target)} x2={pixelX(target)} y1={15} y2={410} stroke="#238443" strokeDasharray="5 5" />}
        </Plot>
      </ScalesProvider>
      {practice && <Group><Button variant="light" disabled={value === null} onClick={() => { setFeedback(true); record('practice_feedback'); }}>Show target</Button><Text size="sm">The green line marks the target.</Text></Group>}
    </Container>
  );
}

export default function Pilot(props: StimulusParams<Parameters>) {
  return <Trial key={props.parameters.trialId} {...props} />;
}
