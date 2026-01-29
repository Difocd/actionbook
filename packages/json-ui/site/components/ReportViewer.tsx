'use client';

import React from 'react';
import { registry } from '@/lib/registry';
import type { UINode } from '@/lib/types';

function renderNode(node: UINode, index: number): React.ReactNode {
  const Component = registry[node.type];
  if (!Component) {
    console.warn(`Unknown component type: ${node.type}`);
    return null;
  }

  const children = node.children?.map((child, i) => renderNode(child, i));

  return (
    <Component key={`${node.type}-${index}`} props={node.props || {}}>
      {children}
    </Component>
  );
}

export function ReportViewer({ tree }: { tree: UINode }) {
  return <>{renderNode(tree, 0)}</>;
}
