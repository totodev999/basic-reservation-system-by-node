import { useContext, use, Suspense } from 'react';
import { Context } from '../Base';
import axios from 'axios';
import { useNavigate } from 'react-router';
import { ErrorBoundary } from 'react-error-boundary';

const ReservationType = () => {
  return (
    <div className="grid place-content-center min-h-screen min-w-max">
      <h2 className="text-center text-3xl">How can I help you?</h2>
      <div className="mt-10">
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <ShowReservationType />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

const getReservationType = async () => {
  const res = await axios.get<
    {
      id: number;
      typeName: string;
      defaultMinutes: number;
      description: string;
    }[]
  >('/api/reservation-type');
  return res.data;
};

// use hook cannot invoke function, so you have to invoke function before use
const invokeGetReservationType = getReservationType();

export const ShowReservationType = () => {
  const data = use(invokeGetReservationType);

  const navigate = useNavigate();

  const { setState } = useContext(Context)!;

  const handleClick = (id: number) => {
    setState({ stateString: 'reservationType', state: id });
    navigate('/store');
  };

  return (
    <div className="flex flex-col gap-2 justify-center w-screen">
      {data.map((item) => {
        return (
          <div className="mx-auto text-center" key={item.id}>
            <button
              className="bg-teal-300 block w-[300px] p-3 border-amber-100 border-4 duration-200 hover:scale-110 hover:border-dashed focus:scale-110 focus:border-dashed focus:outline-none"
              onClick={() => handleClick(item.id)}
            >
              <div className="font-bold">{item.typeName}</div>
              <div>Time:{item.defaultMinutes}</div>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ReservationType;
