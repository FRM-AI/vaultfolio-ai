import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, BarChart3, Newspaper, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnalyzeService } from "./Analyze.service";
import { StockChart } from "@/components/StockChart";
import { STOCK_SUGGESTIONS } from "@/constants/stocks";
import { CryptoSupportInfo } from "@/constants/crypto";

type SectionKey =
	| "technical_analysis"
	| "news_analysis"
	| "proprietary_trading_analysis"
	| "foreign_trading_analysis"
	| "shareholder_trading_analysis"
	| "intraday_analysis";

type DisplaySection = {
	key: SectionKey;
	label: string;
};

type SectionState = Record<SectionKey, string>;

type AnalyzeStreamEvent = {
	type: string;
	message?: string;
	progress?: number;
	section?: SectionKey;
	text?: string;
	title?: string;
	[key: string]: unknown;
};

type AnalyzeStream = (
	params: Record<string, unknown>,
	init?: { signal?: AbortSignal }
) => AsyncGenerator<AnalyzeStreamEvent>;

type AnalysisSelection = "all" | SectionKey;

const STOCK_ANALYSIS_SEQUENCE: SectionKey[] = [
	"proprietary_trading_analysis",
	"intraday_analysis",
	"shareholder_trading_analysis",
	"foreign_trading_analysis",
	"technical_analysis",
	"news_analysis",
];

const CRYPTO_ANALYSIS_SEQUENCE: SectionKey[] = [
	"technical_analysis",
	"news_analysis",
];

const PRO_ANALYSIS_SECTIONS: ReadonlyArray<SectionKey> = [
	"technical_analysis",
	"news_analysis",
	"proprietary_trading_analysis",
	"foreign_trading_analysis",
	"shareholder_trading_analysis",
	"intraday_analysis",
];

const createEmptySections = (): SectionState => ({
	technical_analysis: "",
	news_analysis: "",
	proprietary_trading_analysis: "",
	foreign_trading_analysis: "",
	shareholder_trading_analysis: "",
	intraday_analysis: "",
});

const markdownComponents = {
	table: (props) => (
		<div className="overflow-x-auto my-8 rounded-lg border-2 border-primary/20 shadow-[var(--shadow-card)]">
			<table className="min-w-full divide-y divide-border" {...props} />
		</div>
	),
	thead: (props) => <thead className="bg-gradient-to-r from-primary/10 to-accent/10" {...props} />,
	th: (props) => <th className="px-6 py-4 text-left text-sm font-bold text-foreground uppercase tracking-wider" {...props} />,
	td: (props) => <td className="px-6 py-4 text-sm text-foreground border-t border-border hover:bg-muted/50 transition-colors" {...props} />,
	tr: (props) => <tr className="hover:bg-muted/30 transition-colors" {...props} />,
};

const MAX_SUGGESTIONS = 6;
const DEFAULT_NEWS_LOOKBACK_DAYS = 30;

export default function AnalyzePanel() {
	const { t } = useLanguage();
	const [searchValue, setSearchValue] = useState<{ stockCode: string; assetType: "stock" | "crypto"; analysisTarget: AnalysisSelection }>({
		stockCode: "",
		assetType: "stock",
		analysisTarget: "all",
	});
	const [status, setStatus] = useState<string>("");
	const [progress, setProgress] = useState<number>(0);
	const [sections, setSections] = useState<SectionState>(() => createEmptySections());
	const [chartData, setChartData] = useState<any>(null);
	const abortRef = useRef<AbortController | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
	const activeSearchIdRef = useRef(0);
	const lastChartRequestRef = useRef<{ code: string; assetType: "stock" | "crypto" } | null>(null);
	const lastSearchParamsRef = useRef<{ code: string; assetType: "stock" | "crypto" } | null>(null);

	const normalizedQuery = useMemo(() => searchValue.stockCode.trim().toUpperCase(), [searchValue.stockCode]);

	const STOCK_CODES = useMemo(() => new Set(STOCK_SUGGESTIONS.map((s) => s.code.toUpperCase())), []);
	const CRYPTO_CODES = useMemo(() => new Set(CryptoSupportInfo.map((c) => c.toUpperCase())), []);

	const isAllowedSymbol = useMemo(() => {
		if (!normalizedQuery) return false;
		return searchValue.assetType === "crypto" ? CRYPTO_CODES.has(normalizedQuery) : STOCK_CODES.has(normalizedQuery);
	}, [CRYPTO_CODES, STOCK_CODES, normalizedQuery, searchValue.assetType]);

	const filteredSuggestions = useMemo(() => {
		// Crypto: simple prefix match on code
		if (searchValue.assetType === "crypto") {
			const list = CryptoSupportInfo.map((code) => ({ code, name: code }));
			if (!normalizedQuery) return list.slice(0, MAX_SUGGESTIONS);
			return list
				.filter((item) => item.code.toUpperCase().startsWith(normalizedQuery))
				.slice(0, MAX_SUGGESTIONS);
		}

		// Stocks: prioritize by relevance
		if (!normalizedQuery) {
			return STOCK_SUGGESTIONS.slice(0, MAX_SUGGESTIONS);
		}

		const q = normalizedQuery;
		const shortQuery = q.length <= 2; // avoid noisy name matches for very short queries

		const startsWith: typeof STOCK_SUGGESTIONS = [] as any;
		const codeContains: typeof STOCK_SUGGESTIONS = [] as any;
		const nameContains: typeof STOCK_SUGGESTIONS = [] as any;

		for (const s of STOCK_SUGGESTIONS) {
			const code = s.code.toUpperCase();
			const name = s.name.toUpperCase();
			if (code.startsWith(q)) startsWith.push(s);
			else if (!shortQuery && code.includes(q)) codeContains.push(s);
			else if (!shortQuery && name.includes(q)) nameContains.push(s);
		}

		const sortByCode = (a: { code: string }, b: { code: string }) => a.code.localeCompare(b.code);
		startsWith.sort(sortByCode);
		codeContains.sort(sortByCode);
		nameContains.sort(sortByCode);

		const merged = [...startsWith, ...codeContains, ...nameContains];
		const seen = new Set<string>();
		const result: typeof STOCK_SUGGESTIONS = [] as any;
		for (const s of merged) {
			if (seen.has(s.code)) continue;
			seen.add(s.code);
			result.push(s);
			if (result.length >= MAX_SUGGESTIONS) break;
		}

		return result;
	}, [normalizedQuery, searchValue.assetType]);

	const sectionLabels = useMemo<Record<SectionKey, string>>(
		() => ({
			technical_analysis: t.analyze.sections.technical_analysis,
			news_analysis: t.analyze.sections.news_analysis,
			proprietary_trading_analysis: t.analyze.sections.proprietary_trading_analysis,
			foreign_trading_analysis: t.analyze.sections.foreign_trading_analysis,
			shareholder_trading_analysis: t.analyze.sections.shareholder_trading_analysis,
			intraday_analysis: t.analyze.sections.intraday_analysis,
		}),
		[t]
	);

	const tabsConfig = useMemo(
		() => [
			{
				key: "technical_analysis" as const,
				tabValue: "technical",
				icon: BarChart3,
				label: t.analyze.tabs.technical,
			},
			{
				key: "news_analysis" as const,
				tabValue: "news",
				icon: Newspaper,
				label: t.analyze.tabs.news,
			},
			{
				key: "proprietary_trading_analysis" as const,
				tabValue: "proprietaryTrading",
				icon: FileText,
				label: t.analyze.tabs.proprietaryTrading,
			},
			{
				key: "foreign_trading_analysis" as const,
				tabValue: "foreignTrading",
				icon: FileText,
				label: t.analyze.tabs.foreignTrading,
			},
			{
				key: "shareholder_trading_analysis" as const,
				tabValue: "shareholderTrading",
				icon: FileText,
				label: t.analyze.tabs.shareholderTrading,
			},
			{
				key: "intraday_analysis" as const,
				tabValue: "intradayAnalysis",
				icon: FileText,
				label: t.analyze.tabs.intraday,
			},
		],
		[t]
	);

	const [activeTab, setActiveTab] = useState<string>(tabsConfig[0]?.tabValue ?? "technical");

	const availableTabs = useMemo(
		() => tabsConfig.filter((tab) => (sections[tab.key] ?? "").trim().length > 0),
		[sections, tabsConfig]
	);

	const analysisOptions = useMemo<Array<{ value: AnalysisSelection; label: string; isPro: boolean }>>(() => {
		const sequence = searchValue.assetType === "crypto" ? CRYPTO_ANALYSIS_SEQUENCE : STOCK_ANALYSIS_SEQUENCE;
		const tabLabelMap = new Map<SectionKey, string>();
		for (const { key, label } of tabsConfig) {
			tabLabelMap.set(key, label);
		}

		const options = sequence.map((key) => ({
			value: key,
			label: tabLabelMap.get(key) ?? sectionLabels[key] ?? key.replace(/_/g, " "),
			isPro: PRO_ANALYSIS_SECTIONS.includes(key),
		}));

		const allLabel = t.analyze.serviceFilter.all;
		return [
			{ value: "all" as const, label: allLabel, isPro: true },
			...options,
		];
	}, [searchValue.assetType, sectionLabels, tabsConfig, t]);

	useEffect(() => {
		if (availableTabs.length === 0) {
			const fallback = tabsConfig[0]?.tabValue;
			if (fallback && activeTab !== fallback) {
				setActiveTab(fallback);
			}
			return;
		}

		const isActiveAvailable = availableTabs.some((tab) => tab.tabValue === activeTab);
		if (!isActiveAvailable) {
			setActiveTab(availableTabs[0].tabValue);
		}
	}, [availableTabs, tabsConfig, activeTab]);

	useEffect(() => {
		if (analysisOptions.some((option) => option.value === searchValue.analysisTarget)) {
			return;
		}

		setSearchValue((prev) => ({ ...prev, analysisTarget: "all" }));
	}, [analysisOptions, searchValue.analysisTarget]);

	// Helper to transform backend status messages to user-friendly Vietnamese
	const transformStatus = useCallback((rawStatus: string): string => {
		// Replace technical section keys with Vietnamese labels
		const statusMap: Record<string, string> = {
			'proprietary_trading_analysis': sectionLabels['proprietary_trading_analysis'] || 'tự doanh',
			'foreign_trading_analysis': sectionLabels['foreign_trading_analysis'] || 'khối ngoại',
			'shareholder_trading_analysis': sectionLabels['shareholder_trading_analysis'] || 'cổ đông lớn',
			'intraday_analysis': sectionLabels['intraday_analysis'] || 'trong ngày',
			'technical_analysis': sectionLabels['technical_analysis'] || 'kỹ thuật',
			'news_analysis': sectionLabels['news_analysis'] || 'tin tức',
		};

		let transformed = rawStatus;
		for (const [key, label] of Object.entries(statusMap)) {
			transformed = transformed.replace(new RegExp(key, 'gi'), label);
		}

		return transformed;
	}, [sectionLabels]);

	const handleStreaming = useCallback(
		async (sectionKey: SectionKey, stream: AnalyzeStream, payload: Record<string, unknown>) => {
			const controller = new AbortController();
			abortRef.current = controller;
			const sectionLabel = sectionLabels[sectionKey] ?? "";
			setStatus(t.analyze.status.analyzing.replace("{{section}}", sectionLabel));

			try {
				for await (const evt of stream(payload, { signal: controller.signal })) {
					if (evt.type === "status") {
						const rawMessage = evt.message ?? "";
						setStatus(transformStatus(rawMessage));
						if (typeof evt.progress === "number") {
							setProgress(evt.progress);
						}
						continue;
					}

					// Ensure a visible entry is created for section start
					if (evt.type === "section_start") {
						const key = (evt.section as SectionKey) ?? sectionKey;
						const title = typeof evt.title === "string" ? evt.title : sectionLabel;
						setSections((prev) => ({
							...prev,
							[key]: prev[key] ? prev[key] : `## ${title}\n\n`,
						}));
						continue;
					}

					if (evt.type === "content") {
						const key = (evt.section as SectionKey) ?? sectionKey;
						const text = typeof evt.text === "string" ? evt.text : "";
						setSections((prev) => ({ ...prev, [key]: (prev[key] || "") + text }));
						continue;
					}

					// Surface errors inside the corresponding tab so users see what happened
					if (evt.type === "error") {
						const key = (evt.section as SectionKey) ?? sectionKey;
						const msg = typeof evt.message === "string" ? evt.message : "";
						setSections((prev) => ({
							...prev,
							[key]: (prev[key] || "") + `\n\n> ❗ ${msg}`,
						}));
						continue;
					}

					if (evt.type === "complete") {
						setProgress(evt.progress ?? 100);
						setStatus(evt.message ?? t.analyze.status.complete);
					}
				}
			} catch (error) {
				const isAbortError =
					error instanceof DOMException
						? error.name === "AbortError"
						: (error as { name?: string } | null)?.name === "AbortError";

				if (!isAbortError) {
					throw error;
				}
			} finally {
				if (abortRef.current === controller) {
					abortRef.current = null;
				}
			}
		},
		[sectionLabels, t]
	);

	useEffect(() => {
		if (!normalizedQuery) {
			lastChartRequestRef.current = null;
			lastSearchParamsRef.current = null;
		}
	}, [normalizedQuery]);

	const handleSearch = useCallback(async () => {
		if (!normalizedQuery) {
			return;
		}

		const isSameAsset =
			lastSearchParamsRef.current?.code === normalizedQuery &&
			lastSearchParamsRef.current.assetType === searchValue.assetType;

		const requestId = activeSearchIdRef.current + 1;
		activeSearchIdRef.current = requestId;

		abortRef.current?.abort();
		abortRef.current = null;
		setShowSuggestions(false);
		setIsLoading(true);
		setProgress(0);
		if (!isSameAsset) {
			setSections(createEmptySections());
		}

		const lookBackDays = DEFAULT_NEWS_LOOKBACK_DAYS;
		const shouldFetchChart =
			!lastChartRequestRef.current ||
			lastChartRequestRef.current.code !== normalizedQuery ||
			lastChartRequestRef.current.assetType !== searchValue.assetType;

		if (shouldFetchChart) {
			setChartData(null);
			setStatus(t.analyze.status.loadingChart);
		}

		try {
			if (shouldFetchChart) {
				const response = await AnalyzeService.chartData(normalizedQuery, searchValue.assetType);
				if (response) {
					setChartData(response);
					lastChartRequestRef.current = {
						code: normalizedQuery,
						assetType: searchValue.assetType,
					};
				}
			}

			let streamingSteps: Array<{
				key: SectionKey;
				stream: AnalyzeStream;
				payload: Record<string, unknown>;
			}> = [];

			if (searchValue.assetType === "crypto") {
				streamingSteps = [
					{
						key: "technical_analysis",
						stream: AnalyzeService.technicalAnalysisStream,
						payload: { ticker: normalizedQuery, asset_type: searchValue.assetType },
					},
					{
						key: "news_analysis",
						stream: AnalyzeService.newsAnalysisStream,
						payload: { ticker: normalizedQuery, asset_type: searchValue.assetType, look_back_days: lookBackDays },
					},
				];
			} else {
				streamingSteps = [
					{
						key: "proprietary_trading_analysis",
						stream: AnalyzeService.proprietaryTradingAnalysisStream,
						payload: { ticker: normalizedQuery },
					},
					{
						key: "intraday_analysis",
						stream: AnalyzeService.intradayMatchAnalysisStream,
						payload: { ticker: normalizedQuery },
					},
					{
						key: "shareholder_trading_analysis",
						stream: AnalyzeService.shareholderTradingAnalysisStream,
						payload: { ticker: normalizedQuery },
					},
					{
						key: "foreign_trading_analysis",
						stream: AnalyzeService.foreignTradingAnalysisStream,
						payload: { ticker: normalizedQuery },
					},
					{
						key: "technical_analysis",
						stream: AnalyzeService.technicalAnalysisStream,
						payload: { ticker: normalizedQuery, asset_type: searchValue.assetType },
					},
					{
						key: "news_analysis",
						stream: AnalyzeService.newsAnalysisStream,
						payload: { ticker: normalizedQuery, asset_type: searchValue.assetType, look_back_days: lookBackDays },
					},
				];
			}

			if (searchValue.analysisTarget !== "all") {
				streamingSteps = streamingSteps.filter((step) => step.key === searchValue.analysisTarget);
			}

			if (isSameAsset && streamingSteps.length > 0) {
				setSections((prev) => {
					const next = { ...prev };
					for (const step of streamingSteps) {
						next[step.key] = "";
					}
					return next;
				});
			}

			for (const step of streamingSteps) {
				await handleStreaming(step.key, step.stream, step.payload);
			}
		} catch (error) {
			const isAbortError =
				error instanceof DOMException
					? error.name === "AbortError"
					: (error as { name?: string } | null)?.name === "AbortError";

			if (!isAbortError) {
				console.error(error);
				setStatus(t.analyze.status.error);
			}
		} finally {
			if (activeSearchIdRef.current === requestId) {
				lastSearchParamsRef.current = {
					code: normalizedQuery,
					assetType: searchValue.assetType,
				};
				setIsLoading(false);
			}
		}
	}, [handleStreaming, normalizedQuery, searchValue.assetType, searchValue.analysisTarget, t]);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
		};
	}, []);

	const handleSuggestionSelect = useCallback((code: string) => {
		setSearchValue((prev) => ({ ...prev, stockCode: code }));
		setShowSuggestions(false);
	}, []);

	return (
		<div className="space-y-8">
			{/* Header Section */}
			<div className="text-center space-y-2 animate-fade-in">
				<h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
					{t.analyze.title}
				</h2>
				<p className="text-muted-foreground text-lg">{t.analyze.description}</p>
			</div>

			{/* Search Section */}
			<Card className="border-primary/20 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[box-shadow] duration-300 animate-fade-in">
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-3">
						<div className="flex-1 flex flex-col sm:flex-row gap-3">
							<div className="relative flex-1">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
									<Input
										type="text"
										placeholder={t.analyze.searchPlaceholder}
										className="h-12 w-full pl-10 pr-4 border-2 focus:border-primary transition-colors"
										value={searchValue.stockCode}
										onFocus={() => setShowSuggestions(true)}
										onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
										onChange={(event) => {
											const next = event.target.value.toUpperCase();
											setShowSuggestions(true);
											setSearchValue((prev) => ({ ...prev, stockCode: next }));
										}}
										onKeyDown={(event) => {
											if (event.key === "Enter" && !isLoading && isAllowedSymbol) {
												setShowSuggestions(false);
												handleSearch();
											}
										}}
										disabled={isLoading}
									/>

									</div>

									{showSuggestions && filteredSuggestions.length > 0 && (
									<div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-lg border-2 border-primary/20 bg-background shadow-[var(--shadow-hover)] backdrop-blur-sm animate-scale-in">
										<ul className="py-2">
											{filteredSuggestions.map((stock, index) => (
												<li key={stock.code} style={{ animationDelay: `${index * 30}ms` }} className="animate-fade-in">
													<button
														type="button"
														className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-primary/10 group"
														onMouseDown={(event) => event.preventDefault()}
														onClick={() => handleSuggestionSelect(stock.code)}
													>
														<span className="font-bold text-foreground group-hover:text-primary transition-colors">{stock.code}</span>
														<span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{stock.name}</span>
													</button>
												</li>
											))}
										</ul>
									</div>
								)}
							</div>

							<Select
								value={searchValue.analysisTarget}
								onValueChange={(value: AnalysisSelection) =>
									setSearchValue((prev) => ({ ...prev, analysisTarget: value }))
								}
								disabled={isLoading}
							>
								<SelectTrigger className="w-full sm:w-44 h-12 border-2 border-primary/20 focus:border-primary bg-background hover:bg-muted/30 transition-all shadow-sm focus:shadow-[var(--shadow-hover)]">
									<SelectValue placeholder={t.analyze.serviceFilter.label} />
								</SelectTrigger>
								<SelectContent className="z-50 max-h-72 overflow-auto rounded-lg border-2 border-primary/20 bg-background shadow-[var(--shadow-hover)] backdrop-blur-sm">
									{analysisOptions.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
											className="px-4 py-3 transition-colors hover:bg-primary/10 focus:bg-primary/10 cursor-pointer"
										>
											<div className="flex w-full items-center justify-between gap-2">
												<span>{option.label}</span>
												{option.isPro && (
													<Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
														Pro
													</Badge>
												)}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						<Select
							value={searchValue.assetType}
							onValueChange={(value: "stock" | "crypto") => {
								setSearchValue((prev) => ({ ...prev, assetType: value }));
							}}
							disabled={isLoading}
						>
							<SelectTrigger className="w-full sm:w-40 h-12 border-2 border-primary/20 focus:border-primary bg-background hover:bg-muted/30 transition-all shadow-sm focus:shadow-[var(--shadow-hover)]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="z-50 max-h-72 overflow-auto rounded-lg border-2 border-primary/20 bg-background shadow-[var(--shadow-hover)] backdrop-blur-sm">
								<SelectItem 
									value="stock"
									className="px-4 py-3 transition-colors hover:bg-primary/10 focus:bg-primary/10 cursor-pointer"
								>
									{t.analyze.search_type_1}
								</SelectItem>
								<SelectItem 
									value="crypto"
									className="px-4 py-3 transition-colors hover:bg-primary/10 focus:bg-primary/10 cursor-pointer"
								>
									{t.analyze.search_type_2}
								</SelectItem>
							</SelectContent>
						</Select>
						</div>
						<Button
							className="h-12 px-8 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 shadow-[var(--shadow-glow)] transition-all duration-300 font-semibold"
							onClick={handleSearch}
							disabled={isLoading || !normalizedQuery || !isAllowedSymbol}
						>
							<Search className="h-5 w-5 mr-2" />
							{isLoading ? t.analyze.button.loading : t.analyze.button.search}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Progress Section */}
			{status && progress < 100 && (
				<Card className="border-primary/30 shadow-[var(--shadow-card)] animate-fade-in">
					<CardContent className="pt-6">
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
									<p className="text-sm font-semibold text-foreground">{status}</p>
								</div>
								<Badge variant="secondary" className="text-sm font-bold px-3 py-1">{progress}%</Badge>
							</div>
							<div className="relative h-3 bg-muted rounded-full overflow-hidden">
								<div
									className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-accent transition-all duration-500 ease-out shadow-[var(--shadow-glow)]"
									style={{ width: `${Math.min(progress, 100)}%` }}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Chart Section */}
			{chartData && (
				<div className="animate-fade-in">
					<StockChart data={chartData} />
				</div>
			)}

			{/* Analysis Tabs Section */}
			{availableTabs.length > 0 && (
				<Card className="border-primary/20 shadow-[var(--shadow-card)] animate-fade-in">
					<CardContent className="pt-6">
						<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
							<TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 mb-8 h-auto p-3 bg-background/50 backdrop-blur-sm rounded-xl border-2 border-primary/20 shadow-[var(--shadow-card)]">
								{availableTabs.map(({ tabValue, icon: Icon, label }) => (
									<TabsTrigger
										key={tabValue}
										value={tabValue}
										className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all border border-transparent data-[state=active]:border-primary/30 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:font-semibold hover:bg-muted/50"
									>
										<Icon className="h-4 w-4" />
										<span className="hidden sm:inline font-medium">{label}</span>
									</TabsTrigger>
								))}
							</TabsList>

							{availableTabs.map(({ tabValue, key }) => (
								<TabsContent key={tabValue} value={tabValue} className="mt-0 animate-fade-in">
									<div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
										<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
											{sections[key]}
										</ReactMarkdown>
									</div>
								</TabsContent>
							))}
						</Tabs>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
