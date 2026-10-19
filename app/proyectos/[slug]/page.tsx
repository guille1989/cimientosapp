import { ProjectDetail } from "@/components/projects";
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <ProjectDetail slug={slug} />; }
