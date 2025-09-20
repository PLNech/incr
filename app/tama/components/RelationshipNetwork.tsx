import React from 'react';
import { AdvancedTamaData } from '../types-advanced';

interface RelationshipNetworkProps {
  tamas: AdvancedTamaData[];
  onRelationshipClick?: (tamaAId: string, tamaBId: string) => void;
}

export function RelationshipNetwork({ tamas, onRelationshipClick }: RelationshipNetworkProps) {
  // Minimal implementation to make first test pass
  if (tamas.length === 0) {
    return <div>No Tamas in garden</div>;
  }

  // Check if any Tamas have relationships
  const hasRelationships = tamas.some(tama =>
    Object.keys(tama.relationships).length > 0
  );

  return (
    <div>
      {/* Render Tama names - this will make the first test pass */}
      {tamas.map(tama => (
        <div key={tama.id}>{tama.name}</div>
      ))}

      {/* Render relationships if they exist */}
      {tamas.map(tama =>
        Object.entries(tama.relationships).map(([targetId, relationship]) => {
          // Determine relationship CSS class
          const relationshipClass = `relationship-${relationship.relationshipType}`;

          // Determine stroke width based on strength
          const strengthNormalized = Math.abs(relationship.strength);
          const strokeWidth = strengthNormalized > 60 ? '3px' : '1px';

          return (
            <div
              key={`relationship-${tama.id}-${targetId}`}
              data-testid={`relationship-${tama.id}-${targetId}`}
              className={relationshipClass}
              style={{ strokeWidth }}
              data-tooltip={`${relationship.relationshipType === 'friend' ? 'Friendship' :
                relationship.relationshipType === 'enemy' ? 'Enmity' :
                relationship.relationshipType === 'romantic' ? 'Romance' :
                relationship.relationshipType.charAt(0).toUpperCase() + relationship.relationshipType.slice(1).replace('_', ' ')}: ${Math.abs(relationship.strength)}% strength`}
              role="button"
              tabIndex={0}
              onClick={() => onRelationshipClick?.(tama.id, targetId)}
            >
              {/* This placeholder will be replaced with actual SVG lines */}
            </div>
          );
        })
      )}

      {/* Show message if no relationships */}
      {!hasRelationships && <div>No active relationships</div>}
    </div>
  );
}