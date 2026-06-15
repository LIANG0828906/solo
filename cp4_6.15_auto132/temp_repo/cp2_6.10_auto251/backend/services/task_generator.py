import json
import random
import os
from typing import List, Optional, Tuple
from models.schemas import Task, TaskType, TaskOption, Herb


class TaskGenerator:
    def __init__(self, herbs_data_path: str = None):
        if herbs_data_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            herbs_data_path = os.path.join(base_dir, "data", "herbs.json")
        
        with open(herbs_data_path, "r", encoding="utf-8") as f:
            self.herbs = [Herb(**h) for h in json.load(f)]
        
        self.task_counter = 0

    def _get_random_herbs(self, count: int, exclude_id: int = None) -> List[Herb]:
        available = [h for h in self.herbs if h.id != exclude_id] if exclude_id else self.herbs[:]
        selected = random.sample(available, min(count, len(available)))
        return selected

    def _generate_match_efficacy_task(self, period: int, day: int) -> Task:
        correct_herb = random.choice(self.herbs)
        wrong_herbs = self._get_random_herbs(3, correct_herb.id)
        
        all_herbs = [correct_herb] + wrong_herbs
        random.shuffle(all_herbs)
        
        options = [TaskOption(herb_id=h.id, herb_name=h.name) for h in all_herbs]
        question = f"以下哪种草药具有以下功效：「{correct_herb.efficacy}」？"
        
        self.task_counter += 1
        return Task(
            id=self.task_counter,
            period=period,
            day=day,
            type=TaskType.MATCH_EFFICACY,
            question=question,
            options=options,
            correct_herb_id=correct_herb.id,
            time_limit=30
        )

    def _generate_match_indication_task(self, period: int, day: int) -> Task:
        correct_herb = random.choice(self.herbs)
        wrong_herbs = self._get_random_herbs(3, correct_herb.id)
        
        all_herbs = [correct_herb] + wrong_herbs
        random.shuffle(all_herbs)
        
        indication = random.choice(correct_herb.indications)
        options = [TaskOption(herb_id=h.id, herb_name=h.name) for h in all_herbs]
        question = f"有患者出现「{indication}」症状，应选用以下哪种草药治疗？"
        
        self.task_counter += 1
        return Task(
            id=self.task_counter,
            period=period,
            day=day,
            type=TaskType.MATCH_INDICATION,
            question=question,
            options=options,
            correct_herb_id=correct_herb.id,
            time_limit=30
        )

    def _generate_match_meridian_task(self, period: int, day: int) -> Task:
        correct_herb = random.choice(self.herbs)
        wrong_herbs = self._get_random_herbs(3, correct_herb.id)
        
        all_herbs = [correct_herb] + wrong_herbs
        random.shuffle(all_herbs)
        
        meridian_str = "、".join(correct_herb.meridians)
        options = [TaskOption(herb_id=h.id, herb_name=h.name) for h in all_herbs]
        question = f"归经为「{meridian_str}」的草药是以下哪一种？"
        
        self.task_counter += 1
        return Task(
            id=self.task_counter,
            period=period,
            day=day,
            type=TaskType.MATCH_MERIDIAN,
            question=question,
            options=options,
            correct_herb_id=correct_herb.id,
            time_limit=25
        )

    def _generate_match_category_task(self, period: int, day: int) -> Task:
        correct_herb = random.choice(self.herbs)
        wrong_herbs = self._get_random_herbs(3, correct_herb.id)
        
        all_herbs = [correct_herb] + wrong_herbs
        random.shuffle(all_herbs)
        
        options = [TaskOption(herb_id=h.id, herb_name=h.name) for h in all_herbs]
        question = f"以下哪种草药属于「{correct_herb.category}」类？"
        
        self.task_counter += 1
        return Task(
            id=self.task_counter,
            period=period,
            day=day,
            type=TaskType.MATCH_CATEGORY,
            question=question,
            options=options,
            correct_herb_id=correct_herb.id,
            time_limit=20
        )

    def _generate_fill_blank_task(self, period: int, day: int) -> Task:
        correct_herb = random.choice(self.herbs)
        wrong_herbs = self._get_random_herbs(3, correct_herb.id)
        
        all_herbs = [correct_herb] + wrong_herbs
        random.shuffle(all_herbs)
        
        options = [TaskOption(herb_id=h.id, herb_name=h.name) for h in all_herbs]
        question = f"「{correct_herb.name}」的性味是：「{correct_herb.nature}」，其常规用量为____？"
        
        self.task_counter += 1
        return Task(
            id=self.task_counter,
            period=period,
            day=day,
            type=TaskType.FILL_BLANK,
            question=question,
            options=options,
            correct_herb_id=correct_herb.id,
            time_limit=20
        )

    def generate_task(self, period: int, day: int, task_type: Optional[TaskType] = None) -> Task:
        if task_type is None:
            task_type = random.choice([
                TaskType.MATCH_EFFICACY,
                TaskType.MATCH_INDICATION,
                TaskType.MATCH_MERIDIAN,
                TaskType.MATCH_CATEGORY,
                TaskType.FILL_BLANK
            ])
        
        task_generators = {
            TaskType.MATCH_EFFICACY: self._generate_match_efficacy_task,
            TaskType.MATCH_INDICATION: self._generate_match_indication_task,
            TaskType.MATCH_MERIDIAN: self._generate_match_meridian_task,
            TaskType.MATCH_CATEGORY: self._generate_match_category_task,
            TaskType.FILL_BLANK: self._generate_fill_blank_task,
        }
        
        return task_generators[task_type](period, day)

    def get_herb_by_id(self, herb_id: int) -> Optional[Herb]:
        return next((h for h in self.herbs if h.id == herb_id), None)

    def get_all_herbs(self) -> List[Herb]:
        return self.herbs
