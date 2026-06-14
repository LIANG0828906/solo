import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Challenge, GrowthDataPoint } from '../types';
import GrowthChart from '../components/GrowthChart