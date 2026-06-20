import json
import os
import copy
import random
from typing import Optional, Dict, Any, Tuple, List

from models.story_model import StoryNode, GameState, Attributes, InventoryItem


class NarrativeEngine:
    def __init__(self):
        self.stories: Dict[str, Dict[str, StoryNode]] = {}
        self._load_templates()

    def _load_templates(self):
        template_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "data", "story_templates.json"
        )
        try:
            with open(template_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for story_key, story_data in data.get("stories", {}).items():
                    nodes = {}
                    for node_data in story_data.get("nodes", []):
                        node = StoryNode(**node_data)
                        nodes[node.id] = node
                    self.stories[story_key] = nodes
        except FileNotFoundError:
            raise Exception(f"Story templates not found at {template_path}")
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON in story templates: {e}")

    def _match_theme_to_story(self, theme: Optional[str]) -> str:
        if not theme:
            return random.choice(list(self.stories.keys()))

        theme_lower = theme.lower()
        keyword_map = {
            "medieval": ["medieval", "fantasy", "castle", "knight", "魔法", "奇幻", "中世纪", "城堡", "骑士"],
            "space": ["space", "sci-fi", "scifi", "galaxy", "star", "太空", "科幻", "星际", "宇宙"],
            "detective": ["detective", "mystery", "crime", "侦探", "推理", "悬疑", "犯罪"],
            "horror": ["horror", "thriller", "scary", "ghost", "恐怖", "惊悚", "鬼", "灵异"],
        }

        for story_key, keywords in keyword_map.items():
            if story_key in self.stories:
                for kw in keywords:
                    if kw in theme_lower:
                        return story_key

        return random.choice(list(self.stories.keys()))

    def get_start_node(self, theme: Optional[str] = None) -> StoryNode:
        story_key = self._match_theme_to_story(theme)
        nodes = self.stories.get(story_key, {})
        for node in nodes.values():
            if node.id.endswith("_start") or node.id == "start":
                return node
        if nodes:
            return list(nodes.values())[0]
        raise Exception("No story nodes available")

    def get_node_by_id(self, node_id: str) -> StoryNode:
        for story_key, nodes in self.stories.items():
            if node_id in nodes:
                return nodes[node_id]
        raise ValueError(f"Node not found: {node_id}")

    def _check_condition(self, condition: Optional[Dict[str, Any]], state: GameState) -> bool:
        if not condition:
            return True

        attrs = state.attributes
        for key, value in condition.items():
            if key == "health" and attrs.health < value:
                return False
            if key == "sanity" and attrs.sanity < value:
                return False
            if key == "gold" and attrs.gold < value:
                return False
            if key == "charisma" and attrs.charisma < value:
                return False
            if key == "has_item":
                if not any(item.id == value for item in state.inventory):
                    return False
        return True

    def _apply_effects(
        self, effects: Optional[Dict[str, float]], state: GameState
    ) -> GameState:
        new_state = copy.deepcopy(state)
        if not effects:
            return new_state

        attrs = new_state.attributes
        for key, value in effects.items():
            if key == "health":
                attrs.health = max(0, min(100, attrs.health + int(value)))
            elif key == "sanity":
                attrs.sanity = max(0, min(100, attrs.sanity + int(value)))
            elif key == "gold":
                attrs.gold = max(0, attrs.gold + int(value))
            elif key == "charisma":
                attrs.charisma = max(0, min(100, attrs.charisma + int(value)))
            elif key == "add_item":
                item_id = str(value)
                if not any(i.id == item_id for i in new_state.inventory):
                    new_state.inventory.append(
                        InventoryItem(
                            id=item_id,
                            name=item_id.replace("_", " ").title(),
                            description=f"A mysterious {item_id}",
                        )
                    )
            elif key == "remove_item":
                item_id = str(value)
                new_state.inventory = [
                    i for i in new_state.inventory if i.id != item_id
                ]

        return new_state

    def process_choice(
        self, current_node_id: str, choice_id: str, state: GameState
    ) -> Tuple[StoryNode, GameState]:
        current_node = self.get_node_by_id(current_node_id)

        chosen_choice = None
        for choice in current_node.choices:
            if choice.id == choice_id:
                chosen_choice = choice
                break

        if not chosen_choice:
            raise ValueError(f"Choice not found: {choice_id}")

        if not self._check_condition(chosen_choice.condition, state):
            raise ValueError("Condition not met for this choice")

        new_state = self._apply_effects(chosen_choice.effect, state)
        next_node = self.get_node_by_id(chosen_choice.next_node_id)
        new_state.currentNodeId = next_node.id

        return next_node, new_state

    def get_available_choices(self, node_id: str, state: GameState) -> List:
        node = self.get_node_by_id(node_id)
        return [c for c in node.choices if self._check_condition(c.condition, state)]
