from fastapi import APIRouter

from api.database import get_db
from api.models import GraphData, GraphEdge, GraphNode

router = APIRouter(prefix="/api", tags=["graph"])


@router.get("/graph", response_model=GraphData)
async def get_graph():
    db = await get_db()

    cursor = await db.execute(
        """
        SELECT n.id, n.title,
               COALESCE(ref_counts.cnt, 0) AS ref_count
        FROM notes n
        LEFT JOIN (
            SELECT target_id, COUNT(*) AS cnt
            FROM link_relations
            WHERE type = 'reference'
            GROUP BY target_id
        ) ref_counts ON n.id = ref_counts.target_id
        """
    )
    note_rows = await cursor.fetchall()

    note_tags_map: dict[str, list[dict]] = {}
    for nr in note_rows:
        cursor = await db.execute(
            """
            SELECT t.id, t.name, t.category
            FROM tags t JOIN note_tags nt ON t.id = nt.tag_id
            WHERE nt.note_id = ?
            """,
            (nr["id"],),
        )
        tag_rows = await cursor.fetchall()
        note_tags_map[nr["id"]] = [
            {"id": t["id"], "name": t["name"], "category": t["category"]}
            for t in tag_rows
        ]

    nodes = []
    for nr in note_rows:
        ref_count = nr["ref_count"]
        radius = min(15 + 5 * ref_count, 40)
        nodes.append(
            GraphNode(
                id=nr["id"],
                title=nr["title"],
                tags=note_tags_map[nr["id"]],
                radius=radius,
            )
        )

    edges: list[GraphEdge] = []

    cursor = await db.execute(
        "SELECT source_id, target_id, type FROM link_relations WHERE type = 'reference'"
    )
    ref_rows = await cursor.fetchall()
    for r in ref_rows:
        edges.append(
            GraphEdge(source=r["source_id"], target=r["target_id"], type="reference")
        )

    cursor = await db.execute(
        """
        SELECT n1.id AS source, n2.id AS target
        FROM note_tags nt1
        JOIN note_tags nt2 ON nt1.tag_id = nt2.tag_id AND nt1.note_id < nt2.note_id
        JOIN notes n1 ON nt1.note_id = n1.id
        JOIN notes n2 ON nt2.note_id = n2.id
        """
    )
    tag_rows = await cursor.fetchall()
    for r in tag_rows:
        edges.append(
            GraphEdge(source=r["source"], target=r["target"], type="tag")
        )

    return GraphData(nodes=nodes, edges=edges)
