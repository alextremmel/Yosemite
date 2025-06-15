import React from 'react';

// This component takes an object of levels and percentages and renders the bar
function WordLevelBar({ distribution }) {
    // A default distribution if none is provided
    const dist = distribution || {};

    const levelColors = {
        1: '#00D800', // Green
        2: '#FFD700', // Yellow
        3: '#FF9500', // Orange
        4: '#FF0000', // Red
        5: '#8A2BE2', // BlueViolet for Proper Nouns
        unknown: '#CCCCCC' // Gray
    };

    const total = Object.values(dist).reduce((sum, val) => sum + val, 0);

    // Don't render the bar if there's no data
    if (total === 0) {
        return (
             <div title="No word data available" className="w-full h-2 flex rounded-b-md overflow-hidden bg-gray-200">
                <div style={{ width: '100%', backgroundColor: levelColors.unknown }}></div>
            </div>
        );
    }
    
    // Create a title for the tooltip
    const tooltipText = Object.entries(dist)
        .map(([level, pct]) => `Level ${level}: ${pct}%`)
        .join(', ');

    return (
        <div title={tooltipText} className="w-full h-2 flex rounded-b-md overflow-hidden bg-gray-200">
            <div style={{ width: `${dist[1] || 0}%`, backgroundColor: levelColors[1] }}></div>
            <div style={{ width: `${dist[2] || 0}%`, backgroundColor: levelColors[2] }}></div>
            <div style={{ width: `${dist[3] || 0}%`, backgroundColor: levelColors[3] }}></div>
            <div style={{ width: `${dist[4] || 0}%`, backgroundColor: levelColors[4] }}></div>
            <div style={{ width: `${dist[5] || 0}%`, backgroundColor: levelColors[5] }}></div>
            <div style={{ width: `${dist.unknown || 0}%`, backgroundColor: levelColors.unknown }}></div>
        </div>
    );
}

export default WordLevelBar;
