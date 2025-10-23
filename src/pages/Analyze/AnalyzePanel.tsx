import { useEffect, useMemo, useRef, useState } from "react";
import { Search, BarChart3, Newspaper, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnalyzeService } from "./Analyze.service";
import { StockChart } from "@/components/StockChart";
import { STOCK_SUGGESTIONS } from "@/constants/stocks";

type SectionKey = "technical_analysis" | "news_analysis" | "proprietary_trading_analysis" |"foreign_trading_analysis" | "shareholder_trading_analysis" | "intraday_analysis";

const MAX_SUGGESTIONS = 6;

export default function AnalyzePanel() {
	const { t } = useLanguage();
	const [searchValue, setSearchValue] = useState<{ stockCode: string; days: string; assetType: string }>({
		stockCode: "",
		days: "",
		assetType: "stock",
	});
	const [status, setStatus] = useState<string>("");
	const [progress, setProgress] = useState<number>(0);
	const [sections, setSections] = useState<Record<SectionKey, string>>({
		technical_analysis: "",
		news_analysis: "",
		proprietary_trading_analysis: "",
		foreign_trading_analysis: "",
		shareholder_trading_analysis: "",
		intraday_analysis: "",
	});
	const [chartData, setChartData] = useState<any>(null);
	const abortRef = useRef<AbortController | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

	const normalizedQuery = searchValue.stockCode.trim().toUpperCase();

	const filteredSuggestions = useMemo(() => {
		if (!normalizedQuery) {
			return STOCK_SUGGESTIONS.slice(0, MAX_SUGGESTIONS);
		}

		return STOCK_SUGGESTIONS.filter((stock) =>
			stock.code.startsWith(normalizedQuery) || stock.name.toUpperCase().includes(normalizedQuery)
		).slice(0, MAX_SUGGESTIONS);
	}, [normalizedQuery]);

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

	const handleStreaming = async (sectionKey: SectionKey, api: any) => {
		const sectionLabel = sectionLabels[sectionKey] ?? "";
		setStatus(t.analyze.status.analyzing.replace("{{section}}", sectionLabel));
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		const stream = api(
			{
				ticker: normalizedQuery,
				look_back_days: Number.parseInt(searchValue.days || "30", 10),
			},
			{ signal: controller.signal }
		);

		for await (const evt of stream) {
			if (evt.type === "status") {
				setStatus(evt.message ?? "");
				if (typeof evt.progress === "number") setProgress(evt.progress);
			}

			if (evt.type === "content") {
				const key = (evt.section as SectionKey) ?? sectionKey;
				const text = evt.text ?? "";
				setSections((prev) => ({ ...prev, [key]: (prev[key] || "") + text }));
			}

			if (evt.type === "complete") {
				setProgress(evt.progress ?? 100);
				setStatus(evt.message ?? t.analyze.status.complete);
			}
		}
	};

	const handleSearch = async () => {
		if (!normalizedQuery) return;

		setShowSuggestions(false);
		setIsLoading(true);
		setStatus(t.analyze.status.loadingChart);
		setProgress(0);
		setSections({ 
			technical_analysis: "", 
			news_analysis: "", 
			proprietary_trading_analysis: "", 
			foreign_trading_analysis: "", 
			shareholder_trading_analysis: "",
			intraday_analysis: ""
		});
		setChartData(null);

		try {
			setStatus(t.analyze.status.loadingChart);
			const response = await AnalyzeService.chartData(normalizedQuery, searchValue.assetType);
			if (response) {
				setChartData(response);
			}
			await handleStreaming("intraday_analysis", AnalyzeService.intradayMatchAnalysisStream);
			await handleStreaming("shareholder_trading_analysis", AnalyzeService.shareholderTradingAnalysisStream);
			await handleStreaming("foreign_trading_analysis", AnalyzeService.foreignTradingAnalysisStream);
			await handleStreaming("proprietary_trading_analysis", AnalyzeService.proprietaryTradingAnalysisStream);
			await handleStreaming("technical_analysis", AnalyzeService.technicalAnalysisStream);
			await handleStreaming("news_analysis", AnalyzeService.newsAnalysisStream);
		} catch (error) {
			console.error(error);
			setStatus(t.analyze.status.error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
		};
	}, []);

	const handleSuggestionSelect = (code: string) => {
		setSearchValue((prev) => ({ ...prev, stockCode: code }));
		setShowSuggestions(false);
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold text-foreground mb-2">{t.analyze.title}</h2>
				<p className="text-muted-foreground">{t.analyze.description}</p>
			</div>

			<Card className="shadow-lg border-primary/20">
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-3">
						<div className="flex-1 flex gap-3">
							<div className="relative flex-1">
								<Input
									type="text"
									placeholder={t.analyze.searchPlaceholder}
													className="h-11 w-full"
									value={searchValue.stockCode}
									onFocus={() => setShowSuggestions(true)}
									onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
													onChange={(event) => {
														const next = event.target.value.toUpperCase();
														setShowSuggestions(true);
														setSearchValue((prev) => ({ ...prev, stockCode: next }));
													}}
									onKeyDown={(event) => {
										if (event.key === "Enter" && !isLoading) {
											setShowSuggestions(false);
											handleSearch();
										}
									}}
									disabled={isLoading}
								/>

								{showSuggestions && filteredSuggestions.length > 0 && (
									<div className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-md border border-border bg-background shadow-lg">
										<ul className="py-2">
											{filteredSuggestions.map((stock) => (
												<li key={stock.code}>
													<button
														type="button"
														className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
														onMouseDown={(event) => event.preventDefault()}
														onClick={() => handleSuggestionSelect(stock.code)}
													>
														<span className="font-semibold text-foreground">{stock.code}</span>
														<span className="text-xs text-muted-foreground">{stock.name}</span>
													</button>
												</li>
											))}
										</ul>
									</div>
								)}
							</div>

							<Input
								type="text"
								placeholder={t.analyze.searchPlaceholder_dates}
								className="w-24 h-11"
								value={searchValue.days}
								onChange={(event) => setSearchValue({ ...searchValue, days: event.target.value })}
								onKeyDown={(event) => event.key === "Enter" && !isLoading && handleSearch()}
								disabled={isLoading}
							/>
							<select
								value={searchValue.assetType}
								onChange={(event) => setSearchValue({ ...searchValue, assetType: event.target.value })}
								className="px-3 py-2 h-11 rounded-md border border-input bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={isLoading}
							>
								<option value="stock">{t.analyze.search_type_1}</option>
								<option value="crypto">{t.analyze.search_type_2}</option>
							</select>
						</div>
						<Button
							className="bg-primary hover:bg-primary/90 h-11 px-6"
							onClick={handleSearch}
							disabled={isLoading || !normalizedQuery}
						>
							<Search className="h-4 w-4 mr-2" />
							{isLoading ? t.analyze.button.loading : t.analyze.button.search}
						</Button>
					</div>
				</CardContent>
			</Card>

			{status && progress < 100 && (
				<Card className="shadow-md">
					<CardContent className="pt-6">
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium text-foreground">{status}</p>
								<Badge variant="secondary">{progress}%</Badge>
							</div>
							<div className="h-3 bg-muted rounded-full overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
									style={{ width: `${Math.min(progress, 100)}%` }}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{chartData && <StockChart data={chartData} />}

			{(sections.technical_analysis || sections.news_analysis || sections.proprietary_trading_analysis || sections.foreign_trading_analysis || sections.shareholder_trading_analysis) && (
				<Card className="shadow-lg">
					<CardContent className="pt-6">
						<Tabs defaultValue="technical" className="w-full">
							<TabsList className="grid w-full grid-cols-6 mb-6">
								<TabsTrigger value="technical" className="gap-2">
									<BarChart3 className="h-4 w-4" />
									{t.analyze.tabs.technical}
								</TabsTrigger>
								<TabsTrigger value="news" className="gap-2">
									<Newspaper className="h-4 w-4" />
									{t.analyze.tabs.news}
								</TabsTrigger>
								<TabsTrigger value="proprietaryTrading" className="gap-2">
									<FileText className="h-4 w-4" />
									{t.analyze.tabs.proprietaryTrading}
								</TabsTrigger>
								<TabsTrigger value="foreignTrading" className="gap-2">
									<FileText className="h-4 w-4" />
									{t.analyze.tabs.foreignTrading}
								</TabsTrigger>
								<TabsTrigger value="shareholderTrading" className="gap-2">
									<FileText className="h-4 w-4" />
									{t.analyze.tabs.shareholderTrading}
								</TabsTrigger>
								<TabsTrigger value="intradayAnalysis" className="gap-2">
									<FileText className="h-4 w-4" />
									{t.analyze.tabs.intraday}
								</TabsTrigger>
							</TabsList>

							<TabsContent value="technical" className="mt-0">
								<div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground">
									<ReactMarkdown
										remarkPlugins={[remarkGfm]}
										components={{
											table: ({ node, ...props }) => (
												<div className="overflow-x-auto my-6">
													<table className="min-w-full divide-y divide-border border border-border rounded-lg" {...props} />
												</div>
											),
											thead: ({ node, ...props }) => <thead className="bg-muted/50" {...props} />,
											th: ({ node, ...props }) => (
												<th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
											),
											td: ({ node, ...props }) => (
												<td className="px-4 py-3 text-sm text-foreground border-t border-border" {...props} />
											),
										}}
									>
										{sections.technical_analysis || t.analyze.noContent}
									</ReactMarkdown>
								</div>
							</TabsContent>

							<TabsContent value="news" className="mt-0">
								<div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground">
									<ReactMarkdown
										remarkPlugins={[remarkGfm]}
										components={{
											table: ({ node, ...props }) => (
												<div className="overflow-x-auto my-6">
													<table className="min-w-full divide-y divide-border border border-border rounded-lg" {...props} />
												</div>
											),
											thead: ({ node, ...props }) => <thead className="bg-muted/50" {...props} />,
											th: ({ node, ...props }) => (
												<th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
											),
											td: ({ node, ...props }) => (
												<td className="px-4 py-3 text-sm text-foreground border-t border-border" {...props} />
											),
										}}
									>
										{sections.news_analysis || t.analyze.noContent}
									</ReactMarkdown>
								</div>
							</TabsContent>

							<TabsContent value="proprietaryTrading" className="mt-0">
								<div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground">
									<ReactMarkdown
										remarkPlugins={[remarkGfm]}
										components={{
											table: ({ node, ...props }) => (
												<div className="overflow-x-auto my-6">
													<table className="min-w-full divide-y divide-border border border-border rounded-lg" {...props} />
												</div>
											),
											thead: ({ node, ...props }) => <thead className="bg-muted/50" {...props} />,
											th: ({ node, ...props }) => (
												<th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
											),
											td: ({ node, ...props }) => (
												<td className="px-4 py-3 text-sm text-foreground border-t border-border" {...props} />
											),
										}}
									>
										{sections.proprietary_trading_analysis || t.analyze.noContent}
									</ReactMarkdown>
								</div>
							</TabsContent>
							<TabsContent value="foreignTrading" className="mt-0">
								<div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground">
									<ReactMarkdown
										remarkPlugins={[remarkGfm]}
										components={{
											table: ({ node, ...props }) => (
												<div className="overflow-x-auto my-6">
													<table className="min-w-full divide-y divide-border border border-border rounded-lg" {...props} />
												</div>
											),
											thead: ({ node, ...props }) => <thead className="bg-muted/50" {...props} />,
											th: ({ node, ...props }) => (
												<th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
											),
											td: ({ node, ...props }) => (
												<td className="px-4 py-3 text-sm text-foreground border-t border-border" {...props} />
											),
										}}
									>
										{sections.foreign_trading_analysis || t.analyze.noContent}
									</ReactMarkdown>
								</div>
							</TabsContent>
							<TabsContent value="shareholderTrading" className="mt-0">
								<div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground">
									<ReactMarkdown
										remarkPlugins={[remarkGfm]}
										components={{
											table: ({ node, ...props }) => (
												<div className="overflow-x-auto my-6">
													<table className="min-w-full divide-y divide-border border border-border rounded-lg" {...props} />
												</div>
											),
											thead: ({ node, ...props }) => <thead className="bg-muted/50" {...props} />,
											th: ({ node, ...props }) => (
												<th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
											),
											td: ({ node, ...props }) => (
												<td className="px-4 py-3 text-sm text-foreground border-t border-border" {...props} />
											),
										}}
									>
										{sections.shareholder_trading_analysis || t.analyze.noContent}
									</ReactMarkdown>
								</div>
							</TabsContent>
							<TabsContent value="intradayAnalysis" className="mt-0">
								<div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground">
									<ReactMarkdown
										remarkPlugins={[remarkGfm]}
										components={{
											table: ({ node, ...props }) => (
												<div className="overflow-x-auto my-6">
													<table className="min-w-full divide-y divide-border border border-border rounded-lg" {...props} />
												</div>
											),
											thead: ({ node, ...props }) => <thead className="bg-muted/50" {...props} />,
											th: ({ node, ...props }) => (
												<th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
											),
											td: ({ node, ...props }) => (
												<td className="px-4 py-3 text-sm text-foreground border-t border-border" {...props} />
											),
										}}
									>
										{sections.intraday_analysis || t.analyze.noContent}
									</ReactMarkdown>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
