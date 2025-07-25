import { relative } from 'pathe';
import { parse as stackTraceParse } from 'stacktrace-parser';
import { isCI } from 'std-env';
import type {
  DefaultReporterOptions,
  Duration,
  GetSourcemap,
  NormalizedConfig,
  Reporter,
  SnapshotSummary,
  TestFileInfo,
  TestFileResult,
  TestResult,
  UserConsoleLog,
} from '../types';
import {
  color,
  getTaskNameWithPrefix,
  logger,
  prettyTestPath,
  prettyTime,
} from '../utils';
import { StatusRenderer } from './statusRenderer';
import { printSummaryErrorLogs, printSummaryLog } from './summary';

const statusStr = {
  fail: '✗',
  pass: '✓',
  todo: '-',
  skip: '-',
};

const statusColorfulStr = {
  fail: color.red(statusStr.fail),
  pass: color.green(statusStr.pass),
  todo: color.gray(statusStr.todo),
  skip: color.gray(statusStr.skip),
};

export class DefaultReporter implements Reporter {
  private rootPath: string;
  private config: NormalizedConfig;
  private options: DefaultReporterOptions = {};
  private statusRenderer: StatusRenderer | undefined;

  constructor({
    rootPath,
    options,
    config,
  }: {
    rootPath: string;
    config: NormalizedConfig;
    options: DefaultReporterOptions;
  }) {
    this.rootPath = rootPath;
    this.config = config;
    this.options = options;
    if (!isCI) {
      this.statusRenderer = new StatusRenderer(rootPath);
    }
  }

  onTestFileStart(test: TestFileInfo): void {
    this.statusRenderer?.addRunningModule(test.testPath);
  }

  onTestFileResult(test: TestFileResult): void {
    this.statusRenderer?.removeRunningModule(test.testPath);

    const relativePath = relative(this.rootPath, test.testPath);
    const { slowTestThreshold } = this.config;

    let title = ` ${color.bold(statusColorfulStr[test.status])} ${prettyTestPath(relativePath)}`;

    const formatDuration = (duration: number) => {
      return color[duration > slowTestThreshold ? 'yellow' : 'green'](
        `${prettyTime(duration)}`,
      );
    };

    title += ` ${color.gray(`(${test.results.length})`)}`;

    const isTooSlow = test.duration && test.duration > slowTestThreshold;

    if (isTooSlow) {
      title += ` ${formatDuration(test.duration!)}`;
    }

    const hasRetryCase = test.results.some(
      (result) => (result.retryCount || 0) > 0,
    );

    logger.log(title);

    if (test.status !== 'fail' && !isTooSlow && !hasRetryCase) {
      return;
    }

    const showAllCases =
      isTooSlow &&
      !test.results.some(
        (result) => (result.duration || 0) > slowTestThreshold,
      );

    for (const result of test.results) {
      const isSlowCase = (result.duration || 0) > slowTestThreshold;
      const retried = (result.retryCount || 0) > 0;
      if (
        !showAllCases &&
        result.status !== 'fail' &&
        !isSlowCase &&
        !retried
      ) {
        continue;
      }
      const icon =
        isSlowCase && result.status === 'pass'
          ? color.yellow(statusStr[result.status])
          : statusColorfulStr[result.status];
      const nameStr = getTaskNameWithPrefix(result);
      const duration =
        typeof result.duration !== 'undefined'
          ? ` (${prettyTime(result.duration)})`
          : '';
      const retry = result.retryCount
        ? color.yellow(` (retry x${result.retryCount})`)
        : '';

      console.log(`  ${icon} ${nameStr}${color.gray(duration)}${retry}`);

      if (result.errors) {
        for (const error of result.errors) {
          console.error(color.red(`    ${error.message}`));
        }
      }
    }
  }

  onTestCaseResult(_result: TestResult): void {
    // TODO
    // this.statusRenderer?.updateRunningModule({ result.testPath, status: result.status });
  }

  onUserConsoleLog(log: UserConsoleLog): void {
    const shouldLog = this.config.onConsoleLog?.(log.content) ?? true;

    if (!shouldLog) {
      return;
    }

    const titles = [log.name];

    const testPath = relative(this.rootPath, log.testPath);

    if (log.trace) {
      const [frame] = stackTraceParse(log.trace);
      const filePath = relative(this.rootPath, frame!.file || '');

      if (filePath !== testPath) {
        titles.push(prettyTestPath(testPath));
      }
      titles.push(
        prettyTestPath(filePath) +
          color.gray(`:${frame!.lineNumber}:${frame!.column}`),
      );
    } else {
      titles.push(prettyTestPath(testPath));
    }

    // TODO: output to stdout or stderr
    logger.log(titles.join(color.gray(' | ')));

    logger.log(log.content);
    logger.log('');
  }

  async onExit(): Promise<void> {
    this.statusRenderer?.clear();
  }

  async onTestRunEnd({
    results,
    testResults,
    duration,
    getSourcemap,
    snapshotSummary,
  }: {
    results: TestFileResult[];
    testResults: TestResult[];
    duration: Duration;
    snapshotSummary: SnapshotSummary;
    getSourcemap: GetSourcemap;
  }): Promise<void> {
    this.statusRenderer?.clear();

    if (this.options.summary === false) {
      return;
    }

    await printSummaryErrorLogs({
      testResults,
      results,
      rootPath: this.rootPath,
      getSourcemap,
    });

    printSummaryLog({
      results,
      testResults,
      duration,
      rootPath: this.rootPath,
      snapshotSummary,
    });
  }
}
