"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';

const skillCategories = [
  {
    id: 'frontend',
    label: 'Frontend',
    skills: [
      { name: 'React', level: 90 },
      { name: 'JavaScript', level: 85 },
      { name: 'TypeScript', level: 80 },
      { name: 'Tailwind CSS', level: 90 },
      { name: 'HTML/CSS', level: 95 },
      { name: 'Next.js', level: 70 },
    ]
  },
  {
    id: 'backend',
    label: 'Backend',
    skills: [
      { name: 'Node.js', level: 85 },
      { name: 'Express', level: 85 },
      { name: 'Python', level: 80 },
      { name: 'MongoDB', level: 75 },
      { name: 'PostgreSQL', level: 70 },
      { name: 'REST APIs', level: 85 },
    ]
  },
  {
    id: 'devops',
    label: 'DevOps',
    skills: [
      { name: 'Git', level: 90 },
      { name: 'Docker', level: 65 },
      { name: 'AWS', level: 60 },
      { name: 'Linux', level: 75 },
      { name: 'CI/CD', level: 65 },
    ]
  }
];

export default function LabCanvas() {
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    d3.select(containerRef.current).selectAll('svg').remove();

    const width = containerRef.current.clientWidth;
    const height = 700;

    const nodes = [{ id: 'core', group: 'root', radius: 50, label: 'SKILLS' }];
    const links = [];

    skillCategories.forEach(cat => {
      nodes.push({ id: cat.id, group: 'category', radius: 40, label: cat.label });
      links.push({ source: 'core', target: cat.id, value: 2 });
      
      cat.skills.forEach(skill => {
        nodes.push({ id: skill.name, group: 'skill', radius: skill.level / 3 + 10, label: skill.name, level: skill.level });
        links.push({ source: cat.id, target: skill.name, value: 1 });
      });
    });

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.target.group === 'skill' ? 100 : 180))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(d => d.radius + 10).iterations(2));

    const link = svg.append('g')
      .attr('stroke', '#3F3F46')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value));

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.group === 'root' ? '#F97316' : d.group === 'category' ? '#EA580C' : '#141414')
      .attr('stroke', d => d.group === 'skill' ? '#F97316' : 'none')
      .attr('stroke-width', 2)
      .on('mouseover', (event, d) => setHoveredNode(d))
      .on('mouseout', () => setHoveredNode(null));

    node.append('text')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', d => d.group === 'skill' ? d.radius + 18 : 0)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('fill', d => d.group === 'skill' ? '#A1A1AA' : '#FFFFFF')
      .attr('font-size', d => d.group === 'skill' ? '12px' : '14px')
      .attr('font-weight', d => d.group === 'root' ? 'bold' : 'normal')
      .attr('font-family', 'Syne, sans-serif')
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${
          d.x = Math.max(d.radius, Math.min(width - d.radius, d.x))
        },${
          d.y = Math.max(d.radius, Math.min(height - d.radius, d.y))
        })`);
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    const handleResize = () => {
      const newWidth = containerRef.current.clientWidth;
      svg.attr('width', newWidth).attr('viewBox', [0, 0, newWidth, height]);
      simulation.force('center', d3.forceCenter(newWidth / 2, height / 2));
      simulation.alpha(0.3).restart();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      simulation.stop();
    };
  }, []);

  return (
    <div className="relative w-full border border-forge-muted/20 rounded-3xl bg-[#0c0c0c] flex items-center justify-center overflow-hidden">
      <div ref={containerRef} className="w-full h-[700px] cursor-grab active:cursor-grabbing interactive relative z-10" />
      
      <AnimatePresence>
        {hoveredNode && hoveredNode.group === 'skill' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-8 right-8 bg-forge-surface/80 backdrop-blur-md p-6 rounded-2xl border border-orange-500/50 shadow-2xl pointer-events-none z-20"
          >
            <h3 className="text-white font-bold text-xl mb-2">{hoveredNode.label}</h3>
            <div className="flex items-center gap-4">
              <div className="w-48 h-2 bg-forge-black rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${hoveredNode.level}%` }}
                  className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
                />
              </div>
              <span className="text-orange-500 font-mono font-bold tracking-wider">{hoveredNode.level}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
