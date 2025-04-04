import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DeliveryRequestDetails = ({ id }) => {
  const [request, setRequest] = useState(null);
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequestData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/delivery-requests/${id}`);
      const fetchedRequest = response.data;
      
      console.log('Loaded request details:', fetchedRequest);
      setRequest(fetchedRequest);
      
      // Fetch branch name if needed
      if (fetchedRequest.branch_id) {
        const branchResponse = await axios.get(`/api/branches/${fetchedRequest.branch_id}`);
        setBranch(branchResponse.data.name);
      }
    } catch (err) {
      console.error('Error fetching request details:', err);
      setError(err.response?.data?.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestData();
  }, [id]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default DeliveryRequestDetails; 