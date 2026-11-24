import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Compass, Network, BoxSelect } from 'lucide-react';
import PersonCard from './PersonCard';
import './TreeViewer.css';

// Node sizes for positioning (Professional Card proportions)
const NODE_WIDTH = 250;
const NODE_HEIGHT = 105;
const ROW_GAP = 160; // vertical space between generations
const COL_GAP = 40;  // horizontal space between nodes

export default function TreeViewer({
  people,
  searchMatchIds,
  selectedPersonId,
  onSelectPerson,
  viewMode,
  onCropPhoto,
  onToggleFit,
  pinnedPersonId,
  onTogglePin
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [layoutMode, setLayoutMode] = useState('focus'); // 'focus' | 'full'
  const [isBoxZoomActive, setIsBoxZoomActive] = useState(false);
  const [isDrawingBox, setIsDrawingBox] = useState(false);
  const [boxStart, setBoxStart] = useState({ x: 0, y: 0 });
  const [boxEnd, setBoxEnd] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Focus person priority: selectedPersonId -> pinnedPersonId -> oldest root ancestor
  const focusPerson = useMemo(() => {
    if (selectedPersonId) {
      const found = people.find((p) => p.id === selectedPersonId);
      if (found) return found;
    }
    if (pinnedPersonId) {
      const found = people.find((p) => p.id === pinnedPersonId);
      if (found) return found;
    }
    if (people.length === 0) return null;
    const roots = people.filter((p) => !p.fatherId && !p.motherId);
    if (roots.length > 0) return roots[0];
    return people[0];
  }, [people, selectedPersonId, pinnedPersonId]);

  // Center tree whenever the focal person changes in focal view
  useEffect(() => {
    if (layoutMode === 'focus') {
      setPan({ x: 0, y: 0 });
    }
  }, [focusPerson?.id, layoutMode]);

  // Apply search + gender/marital filters without breaking graph connections
  const filteredPeopleIds = useMemo(() => {
    return new Set(
      people
        .filter((p) => {
          if (viewMode === 'male-only' && p.gender !== 'male') return false;
          if (viewMode === 'female-only' && p.gender !== 'female') return false;
          if (
            viewMode === 'couples-only' &&
            !p.spouseId &&
            !people.some((spouse) => spouse.spouseId === p.id)
          ) {
            return false;
          }
          if (searchMatchIds && !searchMatchIds.has(p.id)) {
            return false;
          }
          return true;
        })
        .map((p) => p.id)
    );
  }, [people, viewMode, searchMatchIds]);

  // Compute layout positions for nodes
  const layout = useMemo(() => {
    if (people.length === 0) return { nodes: [], connections: [] };

    const nodes = [];
    const connections = [];

    // --- FULL TREE VIEW ---
    if (layoutMode === 'full') {
      const levels = {};
      const visitedForLevel = new Set();

      const getLevel = (personId) => {
        if (!personId) return -1;
        if (levels[personId] !== undefined) return levels[personId];
        if (visitedForLevel.has(personId)) return 0; // Break recursion loops

        visitedForLevel.add(personId);
        const p = people.find((item) => item.id === personId);
        if (!p) {
          visitedForLevel.delete(personId);
          return -1;
        }

        let parentMaxLevel = -1;
        if (p.fatherId) {
          parentMaxLevel = Math.max(parentMaxLevel, getLevel(p.fatherId));
        }
        if (p.motherId) {
          parentMaxLevel = Math.max(parentMaxLevel, getLevel(p.motherId));
        }

        const lvl = parentMaxLevel + 1;
        levels[personId] = lvl;
        visitedForLevel.delete(personId);
        return lvl;
      };

      // Assign generation level to everyone
      people.forEach((p) => getLevel(p.id));

      // Align spouses to the same generation level
      people.forEach((p) => {
        if (p.spouseId) {
          const l1 = levels[p.id] || 0;
          const l2 = levels[p.spouseId] || 0;
          if (l1 !== l2) {
            const maxL = Math.max(l1, l2);
            levels[p.id] = maxL;
            levels[p.spouseId] = maxL;
          }
        }
      });

      // Group people by generation level
      const generations = {};
      people.forEach((p) => {
        const lvl = levels[p.id] || 0;
        if (!generations[lvl]) generations[lvl] = [];
        generations[lvl].push(p);
      });

      // Position nodes inside each generation row
      Object.keys(generations).forEach((lvlStr) => {
        const lvl = parseInt(lvlStr, 10);
        const list = generations[lvl];
        const rowY = (lvl - 1) * ROW_GAP;

        // Group spouses adjacent to each other
        const ordered = [];
        const placed = new Set();

        list.forEach((p) => {
          if (placed.has(p.id)) return;
          ordered.push(p);
          placed.add(p.id);

          if (p.spouseId) {
            const sp = list.find((item) => item.id === p.spouseId);
            if (sp && !placed.has(sp.id)) {
              ordered.push(sp);
              placed.add(sp.id);
            }
          }
        });

        const totalWidth = (ordered.length - 1) * (NODE_WIDTH + COL_GAP);
        const startX = -totalWidth / 2;

        ordered.forEach((p, idx) => {
          const pX = startX + idx * (NODE_WIDTH + COL_GAP);
          const isFilteredOut = !filteredPeopleIds.has(p.id);
          const role = p.id === selectedPersonId ? 'focus' : 'member';

          nodes.push({
            id: p.id,
            person: p,
            x: pX,
            y: rowY,
            role,
            isFilteredOut
          });
        });
      });

      // Compute links for full view
      people.forEach((p) => {
        const nodeP = nodes.find((n) => n.id === p.id);
        if (!nodeP) return;

        // Spouse connections
        if (p.spouseId && p.id < p.spouseId) {
          const nodeSp = nodes.find((n) => n.id === p.spouseId);
          if (nodeSp) {
            connections.push({
              id: `spouse-${p.id}-${p.spouseId}`,
              x1: nodeP.x + NODE_WIDTH,
              y1: nodeP.y + NODE_HEIGHT / 2,
              x2: nodeSp.x,
              y2: nodeSp.y + NODE_HEIGHT / 2,
              type: 'spouse'
            });
          }
        }

        // Parent connections
        let fatherNode, motherNode;
        if (p.fatherId) fatherNode = nodes.find((n) => n.id === p.fatherId);
        if (p.motherId) motherNode = nodes.find((n) => n.id === p.motherId);

        if (fatherNode && motherNode) {
          const midX = (fatherNode.x + NODE_WIDTH + motherNode.x) / 2;
          const midY = fatherNode.y + NODE_HEIGHT / 2;
          connections.push({
            id: `child-${p.id}`,
            x1: midX,
            y1: midY,
            x2: nodeP.x + NODE_WIDTH / 2,
            y2: nodeP.y,
            type: 'parent-child'
          });
        } else if (fatherNode) {
          connections.push({
            id: `father-${p.id}`,
            x1: fatherNode.x + NODE_WIDTH / 2,
            y1: fatherNode.y + NODE_HEIGHT,
            x2: nodeP.x + NODE_WIDTH / 2,
            y2: nodeP.y,
            type: 'parent-child'
          });
        } else if (motherNode) {
          connections.push({
            id: `mother-${p.id}`,
            x1: motherNode.x + NODE_WIDTH / 2,
            y1: motherNode.y + NODE_HEIGHT,
            x2: nodeP.x + NODE_WIDTH / 2,
            y2: nodeP.y,
            type: 'parent-child'
          });
        }
      });

      return { nodes, connections };
    }

    // --- FOCAL TREE VIEW (Focus Person + 2 Upper Levels + 2 Lower Levels) ---
    if (!focusPerson) return { nodes: [], connections: [] };
    const nodesF = [];
    const connectionsF = [];
    const visitedF = new Set();

    const addNode = (person, x, y, role) => {
      if (!person || visitedF.has(person.id)) return;
      visitedF.add(person.id);

      const isFilteredOut = !filteredPeopleIds.has(person.id);

      nodesF.push({
        id: person.id,
        person,
        x,
        y,
        role,
        isFilteredOut
      });
    };

    const centerX = -NODE_WIDTH / 2;
    const centerY = -NODE_HEIGHT / 2;

    // Level 0: Focus Person & Spouse
    addNode(focusPerson, centerX, centerY, 'focus');

    let spouse;
    if (focusPerson.spouseId) {
      spouse = people.find((p) => p.id === focusPerson.spouseId);
      if (spouse) {
        const spouseX = centerX + NODE_WIDTH + COL_GAP;
        addNode(spouse, spouseX, centerY, 'spouse');
        connectionsF.push({
          id: `spouse-${focusPerson.id}-${spouse.id}`,
          x1: centerX + NODE_WIDTH,
          y1: centerY + NODE_HEIGHT / 2,
          x2: spouseX,
          y2: centerY + NODE_HEIGHT / 2,
          type: 'spouse'
        });
      }
    }

    const focalCoupleMidX = spouse
      ? centerX + (NODE_WIDTH + COL_GAP / 2)
      : centerX + NODE_WIDTH / 2;

    // ==========================================
    // UPPER LEVELS: Level -1 (Parents) & Level -2 (Grandparents)
    // ==========================================
    let father, mother;
    if (focusPerson.fatherId)
      father = people.find((p) => p.id === focusPerson.fatherId);
    if (focusPerson.motherId)
      mother = people.find((p) => p.id === focusPerson.motherId);

    // Grandparents
    let pgf, pgm, mgf, mgm;
    if (father) {
      if (father.fatherId) pgf = people.find((p) => p.id === father.fatherId);
      if (father.motherId) pgm = people.find((p) => p.id === father.motherId);
    }
    if (mother) {
      if (mother.fatherId) mgf = people.find((p) => p.id === mother.fatherId);
      if (mother.motherId) mgm = people.find((p) => p.id === mother.motherId);
    }

    const y_parents = centerY - ROW_GAP;
    const y_grandparents = centerY - 2 * ROW_GAP;

    const w_father_branch = pgf && pgm ? 2 * NODE_WIDTH + 20 : NODE_WIDTH;
    const w_mother_branch = mgf && mgm ? 2 * NODE_WIDTH + 20 : NODE_WIDTH;

    let fatherX, motherX;

    if (father && mother) {
      const minParentSpacing =
        w_father_branch / 2 + COL_GAP + w_mother_branch / 2;
      const parentSpacing = Math.max(
        minParentSpacing,
        NODE_WIDTH + COL_GAP + 20
      );

      const fatherCenterX = focalCoupleMidX - parentSpacing / 2;
      const motherCenterX = focalCoupleMidX + parentSpacing / 2;
      fatherX = fatherCenterX - NODE_WIDTH / 2;
      motherX = motherCenterX - NODE_WIDTH / 2;

      addNode(father, fatherX, y_parents, 'father');
      addNode(mother, motherX, y_parents, 'mother');

      connectionsF.push({
        id: `parents-spouse-${father.id}-${mother.id}`,
        x1: fatherX + NODE_WIDTH,
        y1: y_parents + NODE_HEIGHT / 2,
        x2: motherX,
        y2: y_parents + NODE_HEIGHT / 2,
        type: 'spouse'
      });

      const parentsMidX = (fatherX + NODE_WIDTH + motherX) / 2;
      connectionsF.push({
        id: `parents-to-focus-${focusPerson.id}`,
        x1: parentsMidX,
        y1: y_parents + NODE_HEIGHT / 2,
        x2: centerX + NODE_WIDTH / 2,
        y2: centerY,
        type: 'parent-child'
      });
    } else if (father) {
      fatherX = focalCoupleMidX - NODE_WIDTH / 2;
      addNode(father, fatherX, y_parents, 'father');
      connectionsF.push({
        id: `father-to-focus-${focusPerson.id}`,
        x1: fatherX + NODE_WIDTH / 2,
        y1: y_parents + NODE_HEIGHT,
        x2: centerX + NODE_WIDTH / 2,
        y2: centerY,
        type: 'parent-child'
      });
    } else if (mother) {
      motherX = focalCoupleMidX - NODE_WIDTH / 2;
      addNode(mother, motherX, y_parents, 'mother');
      connectionsF.push({
        id: `mother-to-focus-${focusPerson.id}`,
        x1: motherX + NODE_WIDTH / 2,
        y1: y_parents + NODE_HEIGHT,
        x2: centerX + NODE_WIDTH / 2,
        y2: centerY,
        type: 'parent-child'
      });
    }

    // Grandparents above Father (Level -2)
    if (father) {
      const fMid = fatherX + NODE_WIDTH / 2;
      if (pgf && pgm) {
        const pgfX = fMid - NODE_WIDTH - 10;
        const pgmX = fMid + 10;
        addNode(pgf, pgfX, y_grandparents, 'grandfather');
        addNode(pgm, pgmX, y_grandparents, 'grandmother');

        connectionsF.push({
          id: `pgp-spouse-${pgf.id}-${pgm.id}`,
          x1: pgfX + NODE_WIDTH,
          y1: y_grandparents + NODE_HEIGHT / 2,
          x2: pgmX,
          y2: y_grandparents + NODE_HEIGHT / 2,
          type: 'spouse'
        });

        connectionsF.push({
          id: `pgp-to-father-${father.id}`,
          x1: (pgfX + NODE_WIDTH + pgmX) / 2,
          y1: y_grandparents + NODE_HEIGHT / 2,
          x2: fatherX + NODE_WIDTH / 2,
          y2: y_parents,
          type: 'parent-child'
        });
      } else if (pgf) {
        const pgfX = fatherX;
        addNode(pgf, pgfX, y_grandparents, 'grandfather');
        connectionsF.push({
          id: `pgf-to-father-${father.id}`,
          x1: pgfX + NODE_WIDTH / 2,
          y1: y_grandparents + NODE_HEIGHT,
          x2: fatherX + NODE_WIDTH / 2,
          y2: y_parents,
          type: 'parent-child'
        });
      } else if (pgm) {
        const pgmX = fatherX;
        addNode(pgm, pgmX, y_grandparents, 'grandmother');
        connectionsF.push({
          id: `pgm-to-father-${father.id}`,
          x1: pgmX + NODE_WIDTH / 2,
          y1: y_grandparents + NODE_HEIGHT,
          x2: fatherX + NODE_WIDTH / 2,
          y2: y_parents,
          type: 'parent-child'
        });
      }
    }

    // Grandparents above Mother (Level -2)
    if (mother) {
      const mMid = motherX + NODE_WIDTH / 2;
      if (mgf && mgm) {
        const mgfX = mMid - NODE_WIDTH - 10;
        const mgmX = mMid + 10;
        addNode(mgf, mgfX, y_grandparents, 'grandfather');
        addNode(mgm, mgmX, y_grandparents, 'grandmother');

        connectionsF.push({
          id: `mgp-spouse-${mgf.id}-${mgm.id}`,
          x1: mgfX + NODE_WIDTH,
          y1: y_grandparents + NODE_HEIGHT / 2,
          x2: mgmX,
          y2: y_grandparents + NODE_HEIGHT / 2,
          type: 'spouse'
        });

        connectionsF.push({
          id: `mgp-to-mother-${mother.id}`,
          x1: (mgfX + NODE_WIDTH + mgmX) / 2,
          y1: y_grandparents + NODE_HEIGHT / 2,
          x2: motherX + NODE_WIDTH / 2,
          y2: y_parents,
          type: 'parent-child'
        });
      } else if (mgf) {
        const mgfX = motherX;
        addNode(mgf, mgfX, y_grandparents, 'grandfather');
        connectionsF.push({
          id: `mgf-to-mother-${mother.id}`,
          x1: mgfX + NODE_WIDTH / 2,
          y1: y_grandparents + NODE_HEIGHT,
          x2: motherX + NODE_WIDTH / 2,
          y2: y_parents,
          type: 'parent-child'
        });
      } else if (mgm) {
        const mgmX = motherX;
        addNode(mgm, mgmX, y_grandparents, 'grandmother');
        connectionsF.push({
          id: `mgm-to-mother-${mother.id}`,
          x1: mgmX + NODE_WIDTH / 2,
          y1: y_grandparents + NODE_HEIGHT,
          x2: motherX + NODE_WIDTH / 2,
          y2: y_parents,
          type: 'parent-child'
        });
      }
    }

    // Siblings of Focus Person (Level 0)
    if (focusPerson.fatherId || focusPerson.motherId) {
      const siblings = people.filter(
        (p) =>
          p.id !== focusPerson.id &&
          ((focusPerson.fatherId && p.fatherId === focusPerson.fatherId) ||
            (focusPerson.motherId && p.motherId === focusPerson.motherId))
      );

      if (siblings.length > 0) {
        const siblingXStart = centerX - NODE_WIDTH - COL_GAP;
        const parentAnchorX =
          father && mother
            ? (fatherX + NODE_WIDTH + motherX) / 2
            : father
            ? fatherX + NODE_WIDTH / 2
            : mother
            ? motherX + NODE_WIDTH / 2
            : centerX + NODE_WIDTH / 2;
        const parentAnchorY =
          father && mother
            ? y_parents + NODE_HEIGHT / 2
            : y_parents + NODE_HEIGHT;

        siblings.forEach((sibling, index) => {
          const siblingX = siblingXStart - index * (NODE_WIDTH + COL_GAP);
          addNode(sibling, siblingX, centerY, 'sibling');

          connectionsF.push({
            id: `sibling-parent-${sibling.id}`,
            x1: parentAnchorX,
            y1: parentAnchorY,
            x2: siblingX + NODE_WIDTH / 2,
            y2: centerY,
            type: 'parent-child'
          });
        });
      }
    }

    // ==========================================
    // LOWER LEVELS: Level +1 (Children) & Level +2 (Grandchildren)
    // ==========================================
    const y_children = centerY + ROW_GAP;
    const y_grandchildren = centerY + 2 * ROW_GAP;

    const children = people.filter(
      (p) => p.fatherId === focusPerson.id || p.motherId === focusPerson.id
    );

    if (children.length > 0) {
      const childBranches = children.map((child) => {
        const gcs = people.filter(
          (p) => p.fatherId === child.id || p.motherId === child.id
        );
        const childSpouse = child.spouseId
          ? people.find((p) => p.id === child.spouseId)
          : null;
        const cRowWidth = childSpouse ? 2 * NODE_WIDTH + 20 : NODE_WIDTH;
        const gcRowWidth =
          gcs.length > 0
            ? gcs.length * NODE_WIDTH + (gcs.length - 1) * COL_GAP
            : 0;
        const branchWidth = Math.max(cRowWidth, gcRowWidth);
        return { child, childSpouse, gcs, branchWidth, gcRowWidth };
      });

      const totalLowerWidth =
        childBranches.reduce((sum, b) => sum + b.branchWidth, 0) +
        (childBranches.length - 1) * COL_GAP;
      let curBranchLeft = focalCoupleMidX - totalLowerWidth / 2;

      const focusBottomAnchorX = spouse
        ? centerX + NODE_WIDTH + COL_GAP / 2
        : centerX + NODE_WIDTH / 2;
      const focusBottomAnchorY = spouse
        ? centerY + NODE_HEIGHT / 2
        : centerY + NODE_HEIGHT;

      childBranches.forEach(
        ({ child, childSpouse, gcs, branchWidth, gcRowWidth }) => {
          const branchMidX = curBranchLeft + branchWidth / 2;

          let childX, childAnchorX, childAnchorY;
          if (childSpouse) {
            childX = branchMidX - NODE_WIDTH - 10;
            const spX = branchMidX + 10;
            addNode(child, childX, y_children, 'child');
            addNode(childSpouse, spX, y_children, 'spouse');

            connectionsF.push({
              id: `child-spouse-${child.id}-${childSpouse.id}`,
              x1: childX + NODE_WIDTH,
              y1: y_children + NODE_HEIGHT / 2,
              x2: spX,
              y2: y_children + NODE_HEIGHT / 2,
              type: 'spouse'
            });

            childAnchorX = branchMidX;
            childAnchorY = y_children + NODE_HEIGHT / 2;
          } else {
            childX = branchMidX - NODE_WIDTH / 2;
            addNode(child, childX, y_children, 'child');
            childAnchorX = branchMidX;
            childAnchorY = y_children + NODE_HEIGHT;
          }

          connectionsF.push({
            id: `focus-to-child-${child.id}`,
            x1: focusBottomAnchorX,
            y1: focusBottomAnchorY,
            x2: childX + NODE_WIDTH / 2,
            y2: y_children,
            type: 'parent-child'
          });

          // Grandchildren (Level +2)
          if (gcs.length > 0) {
            const gcStartX = branchMidX - gcRowWidth / 2;
            gcs.forEach((gc, gcIndex) => {
              const gcX = gcStartX + gcIndex * (NODE_WIDTH + COL_GAP);
              addNode(gc, gcX, y_grandchildren, 'grandchild');

              connectionsF.push({
                id: `child-to-gc-${gc.id}`,
                x1: childAnchorX,
                y1: childAnchorY,
                x2: gcX + NODE_WIDTH / 2,
                y2: y_grandchildren,
                type: 'parent-child'
              });
            });
          }

          curBranchLeft += branchWidth + COL_GAP;
        }
      );
    }

    return { nodes: nodesF, connections: connectionsF };
  }, [people, focusPerson, filteredPeopleIds, layoutMode, selectedPersonId]);

  // Pan directly to the selected node whenever selectedPersonId changes in full tree mode
  // (or recenter to {0, 0} in focus mode where the focus person is placed at the origin)
  useEffect(() => {
    if (!selectedPersonId) return;
    if (layoutMode === 'focus') {
      setPan({ x: 0, y: 0 });
      return;
    }
    const targetNode = layout.nodes.find((n) => n.id === selectedPersonId);
    if (targetNode) {
      const nodeCenterX = targetNode.x + NODE_WIDTH / 2;
      const nodeCenterY = targetNode.y + NODE_HEIGHT / 2;
      setPan({
        x: -nodeCenterX * zoom,
        y: -nodeCenterY * zoom
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersonId, layoutMode]);

  // Center tree on focus node or fit full tree
  const handleResetView = () => {
    if (layoutMode === 'full' && selectedPersonId) {
      const targetNode = layout.nodes.find((n) => n.id === selectedPersonId);
      if (targetNode) {
        const nodeCenterX = targetNode.x + NODE_WIDTH / 2;
        const nodeCenterY = targetNode.y + NODE_HEIGHT / 2;
        setZoom(1);
        setPan({ x: -nodeCenterX, y: -nodeCenterY });
        return;
      }
    }
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Zoom helpers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.2));

  // Wheel zoom helper
  const handleWheelZoom = (e) => {
    e.preventDefault();
    const zoomFactor = 0.05;
    const delta = e.deltaY < 0 ? 1 : -1;
    setZoom((prev) => Math.min(Math.max(prev + delta * zoomFactor, 0.2), 2.5));
  };

  // Drag to pan or Box zoom handlers (fixed card selector check for .professional-person-card)
  const handleMouseDown = (e) => {
    if (
      e.target.tagName === 'BUTTON' ||
      e.target.closest('.professional-person-card') ||
      e.target.closest('.tree-hud') ||
      e.target.tagName === 'SELECT'
    ) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isBoxZoomActive || e.shiftKey) {
      setIsDrawingBox(true);
      setBoxStart({ x, y });
      setBoxEnd({ x, y });
    } else {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isDrawingBox) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setBoxEnd({ x, y });
    } else if (isDragging) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawingBox) {
      setIsDrawingBox(false);

      const x1 = Math.min(boxStart.x, boxEnd.x);
      const x2 = Math.max(boxStart.x, boxEnd.x);
      const y1 = Math.min(boxStart.y, boxEnd.y);
      const y2 = Math.max(boxStart.y, boxEnd.y);

      const boxWidth = x2 - x1;
      const boxHeight = y2 - y1;

      if (boxWidth > 20 && boxHeight > 20) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerCenterX = containerRect.width / 2;
        const containerCenterY = containerRect.height / 2;

        const boxCenterXContainer = (x1 + x2) / 2 - containerCenterX;
        const boxCenterYContainer = (y1 + y2) / 2 - containerCenterY;

        const boxCenterXCanvas = (boxCenterXContainer - pan.x) / zoom;
        const boxCenterYCanvas = (boxCenterYContainer - pan.y) / zoom;

        const zoomX = containerRect.width / boxWidth;
        const zoomY = containerRect.height / boxHeight;
        let newZoom = Math.min(zoomX, zoomY) * zoom;
        newZoom = Math.min(Math.max(newZoom, 0.2), 2.5);

        const newPanX = -boxCenterXCanvas * newZoom;
        const newPanY = -boxCenterYCanvas * newZoom;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
      setIsBoxZoomActive(false);
    }
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsDrawingBox(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div
      className={`tree-container ${isDragging ? 'grabbing' : ''} ${
        isBoxZoomActive ? 'crosshair' : ''
      }`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheelZoom}
    >
      {/* Top Left Mode Indicator */}
      <div className="tree-mode-chip glass-panel">
        <span className="mode-dot" />
        <span>
          {layoutMode === 'focus'
            ? `Focused Pedigree (${focusPerson?.name || 'None'})`
            : `Full Family Tree (${people.length} members)`}
        </span>
      </div>

      {/* Zoom and Navigation HUD */}
      <div className="tree-hud glass-panel">
        <button
          onClick={() =>
            setLayoutMode((prev) => (prev === 'focus' ? 'full' : 'focus'))
          }
          className="btn-icon-sm"
          title={
            layoutMode === 'focus'
              ? 'Switch to Full Tree Layout'
              : 'Switch to Focused Pedigree Layout'
          }
        >
          {layoutMode === 'focus' ? (
            <Network size={16} />
          ) : (
            <Compass size={16} />
          )}
        </button>
        <button
          onClick={() => setIsBoxZoomActive((prev) => !prev)}
          className={`btn-icon-sm ${isBoxZoomActive ? 'hud-active-btn' : ''}`}
          title="Box Zoom Mode (or hold Shift + drag)"
        >
          <BoxSelect size={16} />
        </button>
        <button onClick={handleZoomIn} className="btn-icon-sm" title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <div className="zoom-select-container">
          <select
            value={Math.round(zoom * 100)}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="zoom-select-box"
            title="Zoom level selector"
          >
            {![20, 40, 60, 80, 100, 120, 150, 200, 250].includes(
              Math.round(zoom * 100)
            ) && (
              <option value={Math.round(zoom * 100)}>
                {Math.round(zoom * 100)}%
              </option>
            )}
            <option value={20}>20%</option>
            <option value={40}>40%</option>
            <option value={60}>60%</option>
            <option value={80}>80%</option>
            <option value={100}>100%</option>
            <option value={120}>120%</option>
            <option value={150}>150%</option>
            <option value={200}>200%</option>
            <option value={250}>250%</option>
          </select>
        </div>
        <button
          onClick={handleZoomOut}
          className="btn-icon-sm"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleResetView}
          className="btn-icon-sm"
          title="Reset View"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {isDrawingBox && (
        <div
          className="zoom-marquee-box"
          style={{
            left: Math.min(boxStart.x, boxEnd.x),
            top: Math.min(boxStart.y, boxEnd.y),
            width: Math.abs(boxEnd.x - boxStart.x),
            height: Math.abs(boxEnd.y - boxStart.y)
          }}
        />
      )}

      <div
        className="tree-canvas"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center'
        }}
      >
        {/* SVG connection lines with overflow: visible so arbitrarily large trees never clip */}
        <svg className="connections-svg">
          {layout.connections.map((c) => {
            if (c.type === 'spouse') {
              return (
                <line
                  key={c.id}
                  x1={c.x1 + 1000}
                  y1={c.y1 + 1000}
                  x2={c.x2 + 1000}
                  y2={c.y2 + 1000}
                  className="spouse-line"
                />
              );
            }

            // Curved parent-child paths
            const startX = c.x1 + 1000;
            const startY = c.y1 + 1000;
            const endX = c.x2 + 1000;
            const endY = c.y2 + 1000;
            const controlY1 = startY + (endY - startY) * 0.4;
            const controlY2 = startY + (endY - startY) * 0.6;
            const pathData = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;

            return <path key={c.id} d={pathData} className="child-line" />;
          })}
        </svg>

        {/* Nodes */}
        {layout.nodes.map(({ id, person, x, y, role, isFilteredOut }) => (
          <PersonCard
            key={id}
            person={person}
            role={role}
            isFilteredOut={isFilteredOut}
            isPinned={person.id === pinnedPersonId}
            onTogglePin={onTogglePin}
            style={{
              left: x + 1000,
              top: y + 1000,
              width: NODE_WIDTH,
              height: NODE_HEIGHT
            }}
            onClick={() => onSelectPerson(person.id)}
            onCropPhoto={onCropPhoto}
            onToggleFit={onToggleFit}
          />
        ))}
      </div>
    </div>
  );
}
