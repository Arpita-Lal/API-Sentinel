"""NetworkX access graph for BOLA learning and visualization."""

from __future__ import annotations

from datetime import datetime, timezone
from threading import RLock
from typing import Any

import networkx as nx


class AccessGraph:
    """Directed user-to-object graph with ownership metadata."""

    def __init__(self) -> None:
        self.graph = nx.DiGraph()
        self._lock = RLock()

    def _user_node(self, user_id: int) -> str:
        return f"user:{user_id}"

    def _object_node(self, object_type: str | None, object_id: str | None) -> str:
        return f"object:{object_type or 'unknown'}:{object_id or 'unknown'}"

    def record_access(
        self,
        *,
        user_id: int | None,
        object_type: str | None,
        object_id: str | None,
        endpoint: str,
        action: str,
        role: str | None = None,
        tenant_id: str | None = None,
        owner_id: int | None = None,
        authorized: bool = True,
        timestamp: datetime | None = None,
    ) -> None:
        if user_id is None or object_id is None:
            return

        now = timestamp or datetime.now(timezone.utc)
        user_node = self._user_node(user_id)
        object_node = self._object_node(object_type, object_id)

        with self._lock:
            self.graph.add_node(
                user_node,
                kind="user",
                user_id=user_id,
                role=role,
                tenant_id=tenant_id,
                label=f"User_{user_id}",
                last_seen=now,
            )
            self.graph.add_node(
                object_node,
                kind="object",
                object_type=object_type or "unknown",
                object_id=object_id,
                tenant_id=tenant_id,
                owner_id=owner_id,
                label=f"{(object_type or 'Object').title()}_{object_id}",
                last_seen=now,
            )

            edge_data = self.graph.get_edge_data(user_node, object_node, default=None) or {
                "relation": "ACCESSES",
                "count": 0,
                "allowed_count": 0,
                "blocked_count": 0,
                "actions": [],
                "endpoints": [],
                "first_seen": now,
            }

            edge_data["count"] = int(edge_data.get("count", 0)) + 1
            edge_data["allowed_count"] = int(edge_data.get("allowed_count", 0)) + (1 if authorized else 0)
            edge_data["blocked_count"] = int(edge_data.get("blocked_count", 0)) + (0 if authorized else 1)
            edge_data["last_seen"] = now
            if action not in edge_data["actions"]:
                edge_data["actions"].append(action)
            if endpoint not in edge_data["endpoints"]:
                edge_data["endpoints"].append(endpoint)

            self.graph.add_edge(user_node, object_node, **edge_data)

            if owner_id is not None:
                owner_node = self._user_node(owner_id)
                self.graph.add_node(owner_node, kind="user", user_id=owner_id, label=f"User_{owner_id}", last_seen=now)
                owner_edge = self.graph.get_edge_data(object_node, owner_node, default=None) or {
                    "relation": "OWNS",
                    "count": 0,
                    "first_seen": now,
                }
                owner_edge["count"] = int(owner_edge.get("count", 0)) + 1
                owner_edge["last_seen"] = now
                self.graph.add_edge(object_node, owner_node, **owner_edge)

    def get_user_map(self, user_id: int) -> dict[str, Any]:
        user_node = self._user_node(user_id)

        with self._lock:
            if user_node not in self.graph:
                return {"user_id": user_id, "nodes": [], "edges": [], "allowed_objects": []}

            nodes: list[dict[str, Any]] = []
            edges: list[dict[str, Any]] = []
            allowed_objects: list[dict[str, Any]] = []

            nodes.append({"id": user_node, **dict(self.graph.nodes[user_node])})

            for _, target, data in self.graph.out_edges(user_node, data=True):
                target_attrs = dict(self.graph.nodes[target])
                nodes.append({"id": target, **target_attrs})
                payload = {"source": user_node, "target": target, **data}
                edges.append(payload)
                allowed_objects.append({"node_id": target, **target_attrs, "edge": data})

            return {
                "user_id": user_id,
                "nodes": nodes,
                "edges": edges,
                "allowed_objects": allowed_objects,
            }
